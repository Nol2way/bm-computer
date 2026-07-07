import AccountCrud from './AccountCrud'
import { accountApi } from '../../lib/accountApi'
import { useLang } from '../../i18n/LanguageContext'

export default function PaymentMethods() {
  const { t } = useLang()
  const typeLabel = (v) => ({ promptpay: t('account.promptpay'), bank_transfer: t('account.bankTransfer'), cod: t('account.cod'), card: t('account.card') }[v] || v)
  const api = {
    list: accountApi.listPayments,
    create: accountApi.createPayment,
    update: accountApi.updatePayment,
    remove: accountApi.deletePayment,
  }
  const fields = [
    { key: 'type', label: t('account.payType'), type: 'select', options: [
      { value: 'promptpay', label: t('account.promptpay') },
      { value: 'bank_transfer', label: t('account.bankTransfer') },
      { value: 'card', label: t('account.card') },
      { value: 'cod', label: t('account.cod') },
    ] },
    { key: 'label', label: t('account.label'), maxLength: 40 },
    { key: 'provider', label: t('account.provider'), maxLength: 60 },
    { key: 'account_name', label: t('account.accountName'), maxLength: 80 },
    { key: 'masked', label: t('account.masked'), maxLength: 30 },
  ]
  const blank = { type: 'promptpay', label: '', provider: '', account_name: '', masked: '', is_default: false }
  const renderItem = (x) => (
    <div>
      <div className="flex flex-wrap items-center gap-2 font-semibold">
        {typeLabel(x.type)}{x.label && <span className="text-xs font-normal text-muted">({x.label})</span>}
      </div>
      <div className="text-muted">{[x.provider, x.account_name, x.masked].filter(Boolean).join(' · ')}</div>
    </div>
  )
  return <AccountCrud title={t('account.paymentMethods')} api={api} fields={fields} blank={blank} renderItem={renderItem} emptyText={t('account.noPayment')} emptyIcon="card" />
}
