import AccountCrud from './AccountCrud'
import { accountApi } from '../../lib/accountApi'
import { useLang } from '../../i18n/LanguageContext'

export default function Addresses() {
  const { t } = useLang()
  const api = {
    list: accountApi.listAddresses,
    create: accountApi.createAddress,
    update: accountApi.updateAddress,
    remove: accountApi.deleteAddress,
  }
  const fields = [
    { key: 'label', label: t('account.label'), maxLength: 40 },
    { key: 'recipient', label: t('account.recipient'), required: true, rules: ['name'], maxLength: 60 },
    { key: 'phone', label: t('account.phone'), type: 'tel', required: true, rules: ['phone'], numeric: true, maxLength: 10 },
    { key: 'line1', label: t('account.addressLine'), span: 2, required: true, maxLength: 240 },
    { key: 'district', label: t('account.district'), maxLength: 60 },
    { key: 'amphoe', label: t('account.amphoe'), maxLength: 60 },
    { key: 'province', label: t('account.province'), maxLength: 60 },
    { key: 'postcode', label: t('account.postcode'), rules: ['postcode'], numeric: true, maxLength: 5 },
  ]
  const blank = { label: '', recipient: '', phone: '', line1: '', district: '', amphoe: '', province: '', postcode: '', is_default: false }
  const renderItem = (a) => (
    <div>
      <div className="flex flex-wrap items-center gap-2 font-semibold">
        {a.recipient}{a.label && <span className="text-xs font-normal text-muted">({a.label})</span>}
      </div>
      <div className="text-muted">{a.phone}</div>
      <div className="mt-1">{[a.line1, a.district, a.amphoe, a.province, a.postcode].filter(Boolean).join(' ')}</div>
    </div>
  )
  return <AccountCrud title={t('account.shippingAddress')} api={api} fields={fields} blank={blank} renderItem={renderItem} emptyText={t('account.noAddress')} emptyIcon="pin" />
}
