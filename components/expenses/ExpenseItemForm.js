import React from 'react';
import PropTypes from 'prop-types';
import { FastField, Field } from 'formik';
import { get, isEmpty } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { isURL } from 'validator';

import { createError, ERROR } from '../../lib/errors';
import { formatFormErrorMessage, requireFields } from '../../lib/form-utils';
import { attachmentDropzoneParams, attachmentRequiresFile } from './lib/attachments';

import { Box, Flex } from '../Grid';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import StyledButton from '../StyledButton';
import StyledDropzone from '../StyledDropzone';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputAmount from '../StyledInputAmount';
import StyledInputField from '../StyledInputField';
import { Span } from '../Text';

export const msg = defineMessages({
  previewImgAlt: {
    id: 'ExpenseReceiptImagePreview.Alt',
    defaultMessage: 'Expense receipt preview',
  },
  descriptionLabel: {
    id: 'Fields.description',
    defaultMessage: 'Description',
  },
  amountLabel: {
    id: 'Fields.amount',
    defaultMessage: 'Amount',
  },
  dateLabel: {
    id: 'expense.incurredAt',
    defaultMessage: 'Date',
  },
  removeReceipt: {
    id: 'expense.RemoveReceipt',
    defaultMessage: 'Remove receipt',
  },
  removeItem: {
    id: 'expense.RemoveItem',
    defaultMessage: 'Remove item',
  },
  receiptRequired: {
    id: 'expense.ReceiptRequired',
    defaultMessage: 'Receipt required',
  },
});

/** Validates a single expense item, one field at a time (doesn't return multiple errors) */
export const validateExpenseItem = (expense, item) => {
  const errors = requireFields(item, ['description', 'incurredAt', 'amount']);

  if (isNaN(item.amount)) {
    errors.amount = createError(ERROR.FORM_FIELD_PATTERN);
  }

  if (!isEmpty(errors)) {
    return errors;
  }

  // Attachment URL
  if (attachmentRequiresFile(expense.type)) {
    if (!item.url) {
      errors.url = createError(ERROR.FORM_FIELD_REQUIRED);
    } else if (!isURL(item.url)) {
      errors.url = createError(ERROR.FORM_FIELD_PATTERN);
    }
  }

  return errors;
};

const AttachmentLabel = () => (
  <Span fontSize="13px" whiteSpace="nowrap">
    <FormattedMessage id="Expense.Attachment" defaultMessage="Attachment" />
    &nbsp;&nbsp;
    <PrivateInfoIcon color="#969BA3" />
  </Span>
);

/**
 * Form for a single attachment. Must be used with Formik.
 */
const ExpenseItemForm = ({ attachment, errors, onRemove, onUploadError, currency, requireFile, name }) => {
  const intl = useIntl();
  const { formatMessage } = intl;
  const attachmentKey = `attachment-${attachment.id || attachment.url}`;
  const getFieldName = field => `${name}.${field}`;
  const getError = field => formatFormErrorMessage(intl, get(errors, getFieldName(field)));

  return (
    <Box mb={18} data-cy="expense-attachment-form">
      <Flex flexWrap="wrap">
        {requireFile && (
          <FastField name={getFieldName('url')}>
            {({ field, form, meta }) => {
              const hasValidUrl = field.value && isURL(field.value);
              return (
                <StyledInputField
                  mr={[1, 4]}
                  mt={2}
                  htmlFor={attachmentKey}
                  label={<AttachmentLabel />}
                  data-cy="attachment-url-field"
                  required
                  error={
                    meta.error?.type === ERROR.FORM_FIELD_REQUIRED
                      ? formatMessage(msg.receiptRequired)
                      : formatFormErrorMessage(intl, meta.error)
                  }
                >
                  <StyledDropzone
                    {...attachmentDropzoneParams}
                    data-cy={`${field.name}-dropzone`}
                    name={field.name}
                    isMulti={false}
                    error={meta.error}
                    onSuccess={url => form.setFieldValue(field.name, url)}
                    mockImageGenerator={() => `https://loremflickr.com/120/120/invoice?lock=${attachmentKey}`}
                    fontSize="13px"
                    size={[84, 112]}
                    value={hasValidUrl && field.value}
                    onReject={onUploadError}
                  />
                </StyledInputField>
              );
            }}
          </FastField>
        )}
        <Box flex="1 1" minWidth={170} mt={2}>
          <StyledInputField
            name={getFieldName('description')}
            error={getError('description')}
            htmlFor={`${attachmentKey}-description`}
            label={formatMessage(msg.descriptionLabel)}
            labelFontSize="13px"
            required
          >
            {inputProps => <Field as={StyledInput} {...inputProps} />}
          </StyledInputField>
          <Flex flexWrap="wrap" justifyContent="space-between">
            <StyledInputField
              name={getFieldName('incurredAt')}
              error={getError('incurredAt')}
              htmlFor={`${attachmentKey}-incurredAt`}
              inputType="date"
              required
              label={formatMessage(msg.dateLabel)}
              labelFontSize="13px"
              flex={requireFile ? '1 1 44%' : '1 1 50%'}
              mt={3}
            >
              {inputProps => (
                <Field maxHeight={39} {...inputProps}>
                  {({ field }) => (
                    <StyledInput
                      {...inputProps}
                      {...field}
                      value={typeof field.value === 'string' ? field.value.split('T')[0] : field.value}
                    />
                  )}
                </Field>
              )}
            </StyledInputField>
            <Box flex="0 1 8px" width={[0, 8]} />
            <StyledInputField
              name={getFieldName('amount')}
              error={getError('amount')}
              htmlFor={`${attachmentKey}-amount`}
              label={formatMessage(msg.amountLabel)}
              required
              labelFontSize="13px"
              inputType="number"
              flex="1 1 30%"
              minWidth={150}
              maxWidth="100%"
              mt={3}
            >
              {inputProps => (
                <Field name={inputProps.name}>
                  {({ field, form: { setFieldValue } }) => (
                    <StyledInputAmount
                      {...field}
                      {...inputProps}
                      currency={currency}
                      currencyDisplay="CODE"
                      min={1}
                      maxWidth="100%"
                      placeholder="0.00"
                      onChange={(value, e) => setFieldValue(e.target.name, value)}
                    />
                  )}
                </Field>
              )}
            </StyledInputField>
          </Flex>
        </Box>
      </Flex>
      <Flex alignItems="center" mt={3}>
        {onRemove && (
          <StyledButton
            type="button"
            buttonStyle="dangerSecondary"
            buttonSize="tiny"
            isBorderless
            ml={-10}
            onClick={() => onRemove(attachment)}
          >
            {formatMessage(requireFile ? msg.removeReceipt : msg.removeItem)}
          </StyledButton>
        )}
        <StyledHr flex="1" borderStyle="dashed" borderColor="black.200" />
      </Flex>
    </Box>
  );
};

ExpenseItemForm.propTypes = {
  /** The currency of the collective */
  currency: PropTypes.string.isRequired,
  /** ReactHookForm key */
  name: PropTypes.string.isRequired,
  /** Called when clicking on remove */
  onRemove: PropTypes.func,
  /** A map of errors for this object */
  errors: PropTypes.object,
  /** Wether a file is required for this attachment type */
  requireFile: PropTypes.bool,
  /** Called when an attachment upload fails */
  onUploadError: PropTypes.func.isRequired,
  /** the attachment data */
  attachment: PropTypes.shape({
    id: PropTypes.string,
    url: PropTypes.string,
    description: PropTypes.string,
    incurredAt: PropTypes.string,
    amount: PropTypes.number,
  }).isRequired,
};

ExpenseItemForm.whyDidYouRender = true;

export default React.memo(ExpenseItemForm);
