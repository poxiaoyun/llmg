import { SectionPageLayout } from '@/components/layout'
import { useTranslation } from 'react-i18next'
import { OrdersTable } from './components/orders-table'

export function Orders() {
	const { t } = useTranslation()

	return (
		<SectionPageLayout>
			<SectionPageLayout.Title>{t('Orders')}</SectionPageLayout.Title>
			<SectionPageLayout.Description>
				{t('View paid and pending orders, then submit invoice requests for completed payments.')}
			</SectionPageLayout.Description>
			<SectionPageLayout.Content>
				<OrdersTable />
			</SectionPageLayout.Content>
		</SectionPageLayout>
	)
}