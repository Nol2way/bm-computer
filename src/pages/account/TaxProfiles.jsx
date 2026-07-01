import AccountCrud from './AccountCrud'
import { accountApi } from '../../lib/accountApi'
import { useLang } from '../../i18n/LanguageContext'

export default function TaxProfiles() {
  const { t } = useLang()
  const api = {
    list: accountApi.listTax,
    create: accountApi.createTax,
    update: accountApi.updateTax,
    remove: accountApi.deleteTax,
  }
  const fields = [
    { key: 'entity_type', label: t('account.entityType'), type: 'select', options: [
      { value: 'personal', label: t('account.personal') },
      { value: 'company', label: t('account.company') },
    ] },
    { key: 'name', label: t('account.name'), required: true },
    { key: 'tax_id', label: t('account.taxId'), required: true },
    { key: 'branch', label: t('account.branch') },
    { key: 'phone', label: t('account.phone'), type: 'tel' },
    { key: 'address', label: t('account.fullAddress'), type: 'textarea', span: 2, required: true },
  ]
  const blank = { entity_type: 'personal', name: '', tax_id: '', branch: '', phone: '', address: '', is_default: false }
  const renderItem = (x) => (
    <div>
      <div className="flex flex-wrap items-center gap-2 font-semibold">
        {x.name}<span className="text-xs font-normal text-muted">({x.entity_type === 'company' ? t('account.company') : t('account.personal')})</span>
      </div>
      <div className="text-muted">{t('account.taxId')}: {x.tax_id}{x.branch ? ` · ${x.branch}` : ''}</div>
      <div className="mt-1">{x.address}</div>
    </div>
  )
  return <AccountCrud title={t('account.taxAddress')} api={api} fields={fields} blank={blank} renderItem={renderItem} emptyText={t('account.noTax')} emptyIcon="doc" />
}
