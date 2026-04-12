import { Form, Input, InputNumber, DatePicker, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

export interface FieldDef {
  id: number;
  label_AR: string;
  label_EN: string;
  fieldType: string;
  isRequired: boolean;
  options?: { optionValue: string; label_AR: string; label_EN: string }[];
}

interface Props {
  field: FieldDef;
  language: string;
  disabled?: boolean;
}

export default function DynamicFormField({ field, language, disabled }: Props) {
  const { t } = useTranslation();
  const label = language === 'ar' ? field.label_AR : field.label_EN;
  const rules = field.isRequired ? [{ required: true, message: t('common.required') }] : [];

  const renderInput = () => {
    switch (field.fieldType) {
      case 'number':
        return <InputNumber style={{ width: '100%' }} disabled={disabled} />;

      case 'date':
        return (
          <DatePicker
            style={{ width: '100%' }}
            disabled={disabled}
            format="YYYY-MM-DD"
          />
        );

      case 'datetime':
        return (
          <DatePicker
            showTime
            style={{ width: '100%' }}
            disabled={disabled}
            format="YYYY-MM-DD HH:mm"
          />
        );

      case 'dropdown':
        return (
          <Select
            style={{ width: '100%' }}
            disabled={disabled}
            options={(field.options ?? []).map((o) => ({
              value: o.optionValue,
              label: language === 'ar' ? o.label_AR : o.label_EN,
            }))}
            allowClear
          />
        );

      default: // string
        return <Input disabled={disabled} />;
    }
  };

  // Normalise values for DatePicker
  const normalize = (value: unknown) => {
    if ((field.fieldType === 'date' || field.fieldType === 'datetime') && typeof value === 'string' && value) {
      return dayjs(value);
    }
    return value;
  };

  // Convert DatePicker value back to string for the form store
  const getValueFromEvent = (val: unknown) => {
    if (dayjs.isDayjs(val)) {
      return field.fieldType === 'datetime' ? val.toISOString() : val.format('YYYY-MM-DD');
    }
    return val;
  };

  return (
    <Form.Item
      name={['fieldValues', String(field.id)]}
      label={label}
      rules={rules}
      normalize={normalize}
      getValueFromEvent={getValueFromEvent}
    >
      {renderInput()}
    </Form.Item>
  );
}
