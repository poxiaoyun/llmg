import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { SettingsSection } from '../components/settings-section'
import { useUpdateOption } from '../hooks/use-update-option'

export interface WeChatPaySettingsValues {
  WeChatPayEnabled: boolean
  WeChatPayAppID: string
  WeChatPayMerchantID: string
  WeChatPayMerchantCertificateSerialNumber: string
  WeChatPayMerchantPrivateKey: string
  WeChatPayAPIv3Key: string
  WeChatPayNotifyUrl: string
  WeChatPayReturnUrl: string
  WeChatPayMinTopUp: number
}

interface Props {
  defaultValues: WeChatPaySettingsValues
}

export function WeChatPaySettingsSection(props: Props) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()
  const [loading, setLoading] = useState(false)
  const form = useForm<WeChatPaySettingsValues>({
    defaultValues: props.defaultValues,
  })

  useEffect(() => {
    form.reset(props.defaultValues)
  }, [props.defaultValues, form])

  const handleSave = async () => {
    const values = form.getValues()
    const enabled = !!values.WeChatPayEnabled

    if (enabled && !values.WeChatPayAppID.trim()) {
      toast.error(t('App ID is required'))
      return
    }

    if (enabled && !values.WeChatPayMerchantID.trim()) {
      toast.error(t('Merchant ID is required'))
      return
    }

    if (enabled && !values.WeChatPayMerchantCertificateSerialNumber.trim()) {
      toast.error(t('Certificate serial number is required'))
      return
    }

    if (enabled && !values.WeChatPayMerchantPrivateKey.trim()) {
      toast.error(t('Merchant private key is required'))
      return
    }

    if (enabled && !values.WeChatPayAPIv3Key.trim()) {
      toast.error(t('API v3 key is required'))
      return
    }

    if (enabled && Number(values.WeChatPayMinTopUp) < 1) {
      toast.error(t('Minimum top-up amount must be at least 1'))
      return
    }

    setLoading(true)
    try {
      const options: { key: string; value: string }[] = [
        { key: 'WeChatPayEnabled', value: enabled ? 'true' : 'false' },
        { key: 'WeChatPayAppID', value: values.WeChatPayAppID.trim() },
        {
          key: 'WeChatPayMerchantID',
          value: values.WeChatPayMerchantID.trim(),
        },
        {
          key: 'WeChatPayMerchantCertificateSerialNumber',
          value: values.WeChatPayMerchantCertificateSerialNumber.trim(),
        },
        {
          key: 'WeChatPayNotifyUrl',
          value: values.WeChatPayNotifyUrl.trim(),
        },
        {
          key: 'WeChatPayReturnUrl',
          value: values.WeChatPayReturnUrl.trim(),
        },
        {
          key: 'WeChatPayMinTopUp',
          value: String(values.WeChatPayMinTopUp ?? 1),
        },
      ]

      if ((values.WeChatPayMerchantPrivateKey || '').trim()) {
        options.push({
          key: 'WeChatPayMerchantPrivateKey',
          value: values.WeChatPayMerchantPrivateKey,
        })
      }

      if ((values.WeChatPayAPIv3Key || '').trim()) {
        options.push({
          key: 'WeChatPayAPIv3Key',
          value: values.WeChatPayAPIv3Key,
        })
      }

      for (const option of options) {
        await updateOption.mutateAsync(option)
      }
      toast.success(t('Updated successfully'))
    } catch {
      toast.error(t('Update failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SettingsSection
      title={t('WeChat Pay Gateway')}
      description={t('Configure native WeChat Pay merchant integration')}
    >
      <div className='grid gap-4 md:grid-cols-2'>
        <div className='flex items-center gap-2'>
          <Switch
            checked={form.watch('WeChatPayEnabled')}
            onCheckedChange={(value) =>
              form.setValue('WeChatPayEnabled', value)
            }
          />
          <Label>{t('Enabled')}</Label>
        </div>
        <div className='grid gap-1.5'>
          <Label>{t('Minimum top-up quantity')}</Label>
          <Input
            type='number'
            min={1}
            step={1}
            {...form.register('WeChatPayMinTopUp', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-3'>
        <div className='grid gap-1.5'>
          <Label>{t('App ID')}</Label>
          <Input
            placeholder='wx1234567890abcdef'
            {...form.register('WeChatPayAppID')}
          />
        </div>
        <div className='grid gap-1.5'>
          <Label>{t('Merchant ID')}</Label>
          <Input placeholder='1900000109' {...form.register('WeChatPayMerchantID')} />
        </div>
        <div className='grid gap-1.5'>
          <Label>{t('Certificate Serial Number')}</Label>
          <Input
            placeholder='3775B6A45ACD588826D15E583A95F5DD00000000'
            {...form.register('WeChatPayMerchantCertificateSerialNumber')}
          />
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <div className='grid gap-1.5'>
          <Label>{t('API v3 Key')}</Label>
          <Input
            type='password'
            autoComplete='new-password'
            placeholder={t('Enter new key to update')}
            {...form.register('WeChatPayAPIv3Key')}
          />
        </div>
        <div className='grid gap-1.5'>
          <Label>{t('Callback notification URL')}</Label>
          <Input
            placeholder='https://example.com/api/user/wechat/notify'
            {...form.register('WeChatPayNotifyUrl')}
          />
        </div>
      </div>

      <div className='grid gap-1.5'>
        <Label>{t('Merchant Private Key')}</Label>
        <Textarea
          rows={6}
          className='font-mono text-xs'
          placeholder='-----BEGIN PRIVATE KEY-----'
          {...form.register('WeChatPayMerchantPrivateKey')}
        />
      </div>

      <div className='grid gap-4 md:grid-cols-2'>
        <div className='grid gap-1.5'>
          <Label>{t('Payment return URL')}</Label>
          <Input
            placeholder='https://example.com/console/log'
            {...form.register('WeChatPayReturnUrl')}
          />
        </div>
      </div>

      <Button
        type='button'
        onClick={handleSave}
        disabled={loading || updateOption.isPending}
      >
        {loading || updateOption.isPending
          ? t('Saving...')
          : t('Save WeChat Pay settings')}
      </Button>
    </SettingsSection>
  )
}