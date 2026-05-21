import { SectionPageLayout } from '@/components/layout'
import { useTranslation } from 'react-i18next'
import { InvoiceManagementTable } from './components/invoice-management-table'

export function InvoiceManagement() {
	const { t } = useTranslation()

	return (
		<SectionPageLayout>
			<SectionPageLayout.Title>{t('Invoice Management')}</SectionPageLayout.Title>
			<SectionPageLayout.Description>
				{t('Review invoice applications from users and manually maintain the issuance status.')}
			</SectionPageLayout.Description>
			<SectionPageLayout.Content>
				<InvoiceManagementTable />
			</SectionPageLayout.Content>
		</SectionPageLayout>
	)
}