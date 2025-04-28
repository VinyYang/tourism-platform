import React from 'react';
import { Tooltip } from 'antd';
import { CrownOutlined } from '@ant-design/icons';
import './CulturalFormInteractive.css';

interface CulturalFormOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface CulturalFormProps {
  options: CulturalFormOption[];
  value: string;
  onChange: (value: string) => void;
}

const CulturalFormInteractive: React.FC<CulturalFormProps> = ({ options, value, onChange }) => {
  return (
    <div className="cultural-form-container">
      <h3 className="form-title"><CrownOutlined /> 文化形态体系</h3>
      
      <div className="form-options">
        {options.map(option => (
          <div 
            key={option.value}
            className={`form-option ${value === option.value ? 'active' : ''}`}
            onClick={() => onChange(value === option.value ? '' : option.value)}
          >
            <Tooltip title={option.description}>
              <div className="option-icon">{option.icon}</div>
              <div className="option-title">{option.label}</div>
              {option.description && (
                <div className="option-description">
                  {option.description.length > 30 
                    ? option.description.substring(0, 30) + '...' 
                    : option.description
                  }
                </div>
              )}
            </Tooltip>
          </div>
        ))}
      </div>
      
      <div className="form-description">
        {value && options.find(o => o.value === value)?.description}
      </div>
    </div>
  );
};

export default CulturalFormInteractive; 