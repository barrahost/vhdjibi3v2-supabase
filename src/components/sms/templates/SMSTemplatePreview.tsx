import { SMS_VARIABLES } from '../../../types/sms.types';

interface SMSTemplatePreviewProps {
  content: string;
}

export function SMSTemplatePreview({ content }: SMSTemplatePreviewProps) {
  const previewContent = SMS_VARIABLES.reduce((text, variable) => {
    return text.replace(new RegExp(variable.key, 'g'), variable.example);
  }, content);

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="text-sm font-medium text-gray-700 mb-2">Aperçu :</h4>
      <p className="text-sm text-gray-600 whitespace-pre-wrap">{previewContent}</p>
    </div>
  );
}