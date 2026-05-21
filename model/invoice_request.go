package model

import (
	"errors"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"gorm.io/gorm"
)

type InvoiceRequest struct {
	Id                     int     `json:"id"`
	UserId                 int     `json:"user_id" gorm:"index"`
	TopUpId                int     `json:"topup_id" gorm:"uniqueIndex"`
	TradeNo                string  `json:"trade_no" gorm:"type:varchar(255);index"`
	OrderTime              int64   `json:"order_time" gorm:"index"`
	OrderAmount            float64 `json:"order_amount"`
	Company                string  `json:"company" gorm:"type:varchar(255)"`
	Name                   string  `json:"name" gorm:"type:varchar(255)"`
	Region                 string  `json:"region" gorm:"type:varchar(255)"`
	PaymentInformation     string  `json:"payment_information,omitempty" gorm:"type:text"`
	Email                  string  `json:"email,omitempty" gorm:"type:varchar(255)"`
	TaxID                  string  `json:"tax_id" gorm:"type:varchar(255)"`
	BillingAddress         string  `json:"billing_address" gorm:"type:text"`
	Status                 string  `json:"status" gorm:"type:varchar(32);index"`
	InvoiceRecord          string  `json:"invoice_record,omitempty" gorm:"type:text"`
	InvoiceFilePath        string  `json:"invoice_file_path,omitempty" gorm:"type:text"`
	InvoiceFileName        string  `json:"invoice_file_name,omitempty" gorm:"type:varchar(255)"`
	InvoiceFileContentType string  `json:"invoice_file_content_type,omitempty" gorm:"type:varchar(255)"`
	InvoiceFileSize        int64   `json:"invoice_file_size,omitempty"`
	BillingContactSnapshot string  `json:"billing_contact_snapshot,omitempty" gorm:"type:text"`
	CreatedAt              int64   `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt              int64   `json:"updated_at" gorm:"autoUpdateTime"`
}

type InvoiceRequestWithUser struct {
	InvoiceRequest
	Username    string `json:"username" gorm:"column:username"`
	DisplayName string `json:"display_name" gorm:"column:display_name"`
	UserEmail   string `json:"user_email" gorm:"column:user_email"`
}

const (
	InvoiceRequestStatusPending    = "pending"
	InvoiceRequestStatusProcessing = "processing"
	InvoiceRequestStatusIssued     = "issued"
	InvoiceRequestStatusRejected   = "rejected"
)

const invoiceRequestSearchCountHardLimit = 10000

var (
	ErrInvoiceRequestNotFound     = errors.New("开票申请不存在")
	ErrInvoiceRequestAlreadyExist = errors.New("该订单已提交开票申请")
	ErrInvoiceOrderNotPaid        = errors.New("仅已支付订单可申请发票")
	ErrInvoiceOrderForbidden      = errors.New("无权为该订单申请发票")
	ErrInvoiceRequestStatus       = errors.New("无效的开票状态")
	ErrInvoiceFileNotFound        = errors.New("发票文件不存在")
)

func normalizeInvoiceContact(contact dto.BillingContact) dto.BillingContact {
	return dto.BillingContact{
		Company:            strings.TrimSpace(contact.Company),
		Name:               strings.TrimSpace(contact.Name),
		Country:            strings.TrimSpace(contact.Country),
		PaymentInformation: strings.TrimSpace(contact.PaymentInformation),
		Email:              strings.TrimSpace(contact.Email),
		BillingAddress:     strings.TrimSpace(contact.BillingAddress),
		TaxID:              strings.TrimSpace(contact.TaxID),
	}
}

func buildInvoiceContactSnapshot(contact dto.BillingContact) string {
	if contact.IsEmpty() {
		return ""
	}
	payload, err := common.Marshal(contact)
	if err != nil {
		common.SysError("failed to marshal invoice contact snapshot: " + err.Error())
		return ""
	}
	return string(payload)
}

func parseInvoiceContactSnapshot(snapshot string) dto.BillingContact {
	contact := dto.BillingContact{}
	if strings.TrimSpace(snapshot) == "" {
		return contact
	}
	if err := common.UnmarshalJsonStr(snapshot, &contact); err != nil {
		common.SysError("failed to parse invoice contact snapshot: " + err.Error())
		return dto.BillingContact{}
	}
	return contact
}

func validateInvoiceRequestStatus(status string) bool {
	switch status {
	case InvoiceRequestStatusPending, InvoiceRequestStatusProcessing, InvoiceRequestStatusIssued, InvoiceRequestStatusRejected:
		return true
	default:
		return false
	}
}

func CreateInvoiceRequest(userId int, topUpId int, contact dto.BillingContact) (*InvoiceRequest, error) {
	contact = normalizeInvoiceContact(contact)
	if contact.Company == "" || contact.Name == "" || contact.TaxID == "" || contact.BillingAddress == "" {
		return nil, errors.New("请完善公司、名称、税号和账单地址后再提交")
	}

	var created *InvoiceRequest
	err := DB.Transaction(func(tx *gorm.DB) error {
		topUp := &TopUp{}
		if err := tx.Set("gorm:query_option", "FOR UPDATE").Where("id = ?", topUpId).First(topUp).Error; err != nil {
			return ErrTopUpNotFound
		}
		if topUp.UserId != userId {
			return ErrInvoiceOrderForbidden
		}
		if topUp.Status != common.TopUpStatusSuccess {
			return ErrInvoiceOrderNotPaid
		}

		existing := &InvoiceRequest{}
		if err := tx.Where("top_up_id = ?", topUpId).First(existing).Error; err == nil {
			return ErrInvoiceRequestAlreadyExist
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return err
		}

		orderTime := topUp.CompleteTime
		if orderTime == 0 {
			orderTime = topUp.CreateTime
		}

		request := &InvoiceRequest{
			UserId:                 userId,
			TopUpId:                topUp.Id,
			TradeNo:                topUp.TradeNo,
			OrderTime:              orderTime,
			OrderAmount:            topUp.Money,
			Company:                contact.Company,
			Name:                   contact.Name,
			Region:                 contact.Country,
			PaymentInformation:     contact.PaymentInformation,
			Email:                  contact.Email,
			TaxID:                  contact.TaxID,
			BillingAddress:         contact.BillingAddress,
			Status:                 InvoiceRequestStatusPending,
			BillingContactSnapshot: buildInvoiceContactSnapshot(contact),
		}

		if request.BillingContactSnapshot == "" {
			request.BillingContactSnapshot = topUp.BillingContactSnapshot
		}

		if err := tx.Create(request).Error; err != nil {
			return err
		}
		created = request
		return nil
	})
	if err != nil {
		return nil, err
	}
	return created, nil
}

func GetInvoiceRequestsByTopUpIDs(userId int, topUpIDs []int) ([]*InvoiceRequest, error) {
	if len(topUpIDs) == 0 {
		return []*InvoiceRequest{}, nil
	}
	requests := make([]*InvoiceRequest, 0, len(topUpIDs))
	err := DB.Where("user_id = ? AND top_up_id IN ?", userId, topUpIDs).
		Order("id desc").
		Find(&requests).Error
	return requests, err
}

func GetInvoiceRequestByID(id int) (*InvoiceRequest, error) {
	request := &InvoiceRequest{}
	if err := DB.Where("id = ?", id).First(request).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvoiceRequestNotFound
		}
		return nil, err
	}
	return request, nil
}

func GetInvoiceRequestByIDForUser(id int, userId int) (*InvoiceRequest, error) {
	request := &InvoiceRequest{}
	if err := DB.Where("id = ? AND user_id = ?", id, userId).First(request).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvoiceRequestNotFound
		}
		return nil, err
	}
	return request, nil
}

func GetAllInvoiceRequests(pageInfo *common.PageInfo, keyword string) (requests []*InvoiceRequestWithUser, total int64, err error) {
	tx := DB.Begin()
	if tx.Error != nil {
		return nil, 0, tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	query := tx.Model(&InvoiceRequest{}).
		Joins("LEFT JOIN users ON users.id = invoice_requests.user_id")

	if strings.TrimSpace(keyword) != "" {
		pattern, perr := sanitizeLikePattern(keyword)
		if perr != nil {
			tx.Rollback()
			return nil, 0, perr
		}
		query = query.Where(
			"invoice_requests.trade_no LIKE ? ESCAPE '!' OR invoice_requests.company LIKE ? ESCAPE '!' OR invoice_requests.tax_id LIKE ? ESCAPE '!' OR users.username LIKE ? ESCAPE '!' OR users.display_name LIKE ? ESCAPE '!'",
			pattern,
			pattern,
			pattern,
			pattern,
			pattern,
		)
	}

	if err = query.Limit(invoiceRequestSearchCountHardLimit).Count(&total).Error; err != nil {
		tx.Rollback()
		return nil, 0, err
	}

	if err = query.
		Select("invoice_requests.*, users.username AS username, users.display_name AS display_name, users.email AS user_email").
		Order("invoice_requests.id desc").
		Limit(pageInfo.GetPageSize()).
		Offset(pageInfo.GetStartIdx()).
		Find(&requests).Error; err != nil {
		tx.Rollback()
		return nil, 0, err
	}

	if err = tx.Commit().Error; err != nil {
		return nil, 0, err
	}
	return requests, total, nil
}

func UpdateInvoiceRequestByAdmin(id int, status string, invoiceRecord string) error {
	if !validateInvoiceRequestStatus(status) {
		return ErrInvoiceRequestStatus
	}
	return DB.Transaction(func(tx *gorm.DB) error {
		request := &InvoiceRequest{}
		if err := tx.Set("gorm:query_option", "FOR UPDATE").Where("id = ?", id).First(request).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrInvoiceRequestNotFound
			}
			return err
		}
		request.Status = status
		request.InvoiceRecord = strings.TrimSpace(invoiceRecord)
		request.UpdatedAt = common.GetTimestamp()
		return tx.Save(request).Error
	})
}

func UpdateInvoiceRequestFileByAdmin(id int, filePath string, fileName string, contentType string, fileSize int64) (request *InvoiceRequest, oldFilePath string, err error) {
	if strings.TrimSpace(filePath) == "" || strings.TrimSpace(fileName) == "" {
		return nil, "", ErrInvoiceFileNotFound
	}

	err = DB.Transaction(func(tx *gorm.DB) error {
		request = &InvoiceRequest{}
		if err := tx.Set("gorm:query_option", "FOR UPDATE").Where("id = ?", id).First(request).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrInvoiceRequestNotFound
			}
			return err
		}

		oldFilePath = request.InvoiceFilePath
		request.InvoiceFilePath = strings.TrimSpace(filePath)
		request.InvoiceFileName = strings.TrimSpace(fileName)
		request.InvoiceFileContentType = strings.TrimSpace(contentType)
		request.InvoiceFileSize = fileSize
		request.UpdatedAt = common.GetTimestamp()
		return tx.Save(request).Error
	})

	return request, oldFilePath, err
}

func BuildInvoiceContactFromSnapshot(snapshot string) dto.BillingContact {
	return normalizeInvoiceContact(parseInvoiceContactSnapshot(snapshot))
}