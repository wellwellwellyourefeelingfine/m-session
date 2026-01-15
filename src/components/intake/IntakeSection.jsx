/**
 * IntakeSection Component
 * Renders questions for a single section of the intake
 */

import SingleSelect from './questions/SingleSelect';
import MultiSelect from './questions/MultiSelect';
import TextInput from './questions/TextInput';
import TimePicker from './questions/TimePicker';

export default function IntakeSection({ questions, responses, onUpdateResponse, sectionId }) {
  const renderQuestion = (question) => {
    const value = responses[question.field];

    const commonProps = {
      question,
      value,
      onChange: (newValue) => onUpdateResponse(sectionId, question.field, newValue),
    };

    switch (question.type) {
      case 'single-select':
        return <SingleSelect key={question.field} {...commonProps} />;

      case 'multi-select':
        return <MultiSelect key={question.field} {...commonProps} />;

      case 'text':
        return <TextInput key={question.field} {...commonProps} />;

      case 'time':
        return <TimePicker key={question.field} {...commonProps} />;

      default:
        return (
          <div key={question.field} className="text-[var(--color-text-tertiary)]">
            Unknown question type: {question.type}
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      {questions.map(renderQuestion)}
    </div>
  );
}
