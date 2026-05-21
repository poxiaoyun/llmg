package controller

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

const maxInvoiceFileBytes int64 = 10 * 1024 * 1024

func invoiceUploadDir() string {
	return filepath.Join("uploads", "invoices")
}

func sanitizeInvoiceFileName(name string) string {
	cleanName := filepath.Base(strings.TrimSpace(name))
	cleanName = strings.ReplaceAll(cleanName, "\x00", "")
	if cleanName == "" || cleanName == "." {
		return "invoice-file"
	}
	return cleanName
}

func detectInvoiceFileMeta(filename string, data []byte) (contentType string, ext string, err error) {
	detectedType := http.DetectContentType(data)
	switch detectedType {
	case "application/pdf":
		return detectedType, ".pdf", nil
	case "image/png":
		return detectedType, ".png", nil
	case "image/jpeg":
		return detectedType, ".jpg", nil
	case "image/webp":
		return detectedType, ".webp", nil
	}

	switch strings.ToLower(filepath.Ext(filename)) {
	case ".pdf":
		return "application/pdf", ".pdf", nil
	case ".png":
		return "image/png", ".png", nil
	case ".jpg", ".jpeg":
		return "image/jpeg", ".jpg", nil
	case ".webp":
		return "image/webp", ".webp", nil
	default:
		return "", "", fmt.Errorf("仅支持 PDF、PNG、JPG、JPEG 或 WEBP 文件")
	}
}

func resolveInvoiceFileAbsolutePath(storedPath string) (string, error) {
	cleanPath := strings.TrimSpace(storedPath)
	if cleanPath == "" || filepath.Base(cleanPath) != cleanPath {
		return "", model.ErrInvoiceFileNotFound
	}
	return filepath.Join(invoiceUploadDir(), cleanPath), nil
}

type CreateInvoiceRequest struct {
	TopUpId            int    `json:"topup_id"`
	Company            string `json:"company"`
	Name               string `json:"name"`
	Region             string `json:"region"`
	PaymentInformation string `json:"payment_information"`
	Email              string `json:"email"`
	TaxID              string `json:"tax_id"`
	BillingAddress     string `json:"billing_address"`
}

type InvoiceLookupRequest struct {
	TopUpIds []int `json:"topup_ids"`
}

type UpdateInvoiceRequest struct {
	Status        string `json:"status"`
	InvoiceRecord string `json:"invoice_record"`
}

func CreateUserInvoiceRequest(c *gin.Context) {
	userId := c.GetInt("id")
	var req CreateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.TopUpId <= 0 {
		common.ApiErrorMsg(c, "参数错误")
		return
	}

	request, err := model.CreateInvoiceRequest(userId, req.TopUpId, dto.BillingContact{
		Company:            req.Company,
		Name:               req.Name,
		Country:            req.Region,
		PaymentInformation: req.PaymentInformation,
		Email:              req.Email,
		TaxID:              req.TaxID,
		BillingAddress:     req.BillingAddress,
	})
	if err != nil {
		common.ApiError(c, err)
		return
	}

	common.ApiSuccess(c, request)
}

func LookupUserInvoiceRequests(c *gin.Context) {
	userId := c.GetInt("id")
	var req InvoiceLookupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}

	requests, err := model.GetInvoiceRequestsByTopUpIDs(userId, req.TopUpIds)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	common.ApiSuccess(c, gin.H{
		"items": requests,
	})
}

func GetAllInvoiceRequests(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	keyword := c.Query("keyword")

	requests, total, err := model.GetAllInvoiceRequests(pageInfo, keyword)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(requests)
	common.ApiSuccess(c, pageInfo)
}

func AdminUpdateInvoiceRequest(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		common.ApiErrorMsg(c, "参数错误")
		return
	}

	var req UpdateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiErrorMsg(c, "参数错误")
		return
	}

	if err := model.UpdateInvoiceRequestByAdmin(id, req.Status, req.InvoiceRecord); err != nil {
		common.ApiError(c, err)
		return
	}

	common.ApiSuccess(c, nil)
}

func AdminUploadInvoiceRequestFile(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		common.ApiErrorMsg(c, "参数错误")
		return
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		common.ApiErrorMsg(c, "请上传发票文件")
		return
	}
	if fileHeader.Size <= 0 {
		common.ApiErrorMsg(c, "请上传发票文件")
		return
	}
	if fileHeader.Size > maxInvoiceFileBytes {
		common.ApiErrorMsg(c, "发票文件不能超过 10 MB")
		return
	}

	source, err := fileHeader.Open()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	defer source.Close()

	data, err := io.ReadAll(io.LimitReader(source, maxInvoiceFileBytes+1))
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if int64(len(data)) > maxInvoiceFileBytes {
		common.ApiErrorMsg(c, "发票文件不能超过 10 MB")
		return
	}

	contentType, ext, err := detectInvoiceFileMeta(fileHeader.Filename, data)
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}

	if err = os.MkdirAll(invoiceUploadDir(), 0o755); err != nil {
		common.ApiError(c, err)
		return
	}

	storedPath := fmt.Sprintf("invoice-%d-%d-%s%s", id, common.GetTimestamp(), common.GetRandomString(8), ext)
	absPath := filepath.Join(invoiceUploadDir(), storedPath)
	if err = os.WriteFile(absPath, data, 0o644); err != nil {
		common.ApiError(c, err)
		return
	}

	request, oldPath, err := model.UpdateInvoiceRequestFileByAdmin(
		id,
		storedPath,
		sanitizeInvoiceFileName(fileHeader.Filename),
		contentType,
		int64(len(data)),
	)
	if err != nil {
		_ = os.Remove(absPath)
		common.ApiError(c, err)
		return
	}

	if oldPath != "" && oldPath != storedPath {
		oldAbsPath, resolveErr := resolveInvoiceFileAbsolutePath(oldPath)
		if resolveErr == nil {
			_ = os.Remove(oldAbsPath)
		}
	}

	common.ApiSuccess(c, request)
}

func DownloadUserInvoiceFile(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		common.ApiErrorMsg(c, "参数错误")
		return
	}

	request, err := model.GetInvoiceRequestByIDForUser(id, c.GetInt("id"))
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if request.Status != model.InvoiceRequestStatusIssued {
		common.ApiErrorMsg(c, "发票尚未开具")
		return
	}

	absPath, err := resolveInvoiceFileAbsolutePath(request.InvoiceFilePath)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if _, statErr := os.Stat(absPath); statErr != nil {
		common.ApiError(c, model.ErrInvoiceFileNotFound)
		return
	}

	c.FileAttachment(absPath, sanitizeInvoiceFileName(request.InvoiceFileName))
}

func AdminDownloadInvoiceFile(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		common.ApiErrorMsg(c, "参数错误")
		return
	}

	request, err := model.GetInvoiceRequestByID(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	absPath, err := resolveInvoiceFileAbsolutePath(request.InvoiceFilePath)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if _, statErr := os.Stat(absPath); statErr != nil {
		common.ApiError(c, model.ErrInvoiceFileNotFound)
		return
	}

	c.FileAttachment(absPath, sanitizeInvoiceFileName(request.InvoiceFileName))
}