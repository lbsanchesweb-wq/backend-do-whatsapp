
import React from 'react';

interface ToggleSwitchProps {
  isOn: boolean;
  handleToggle: () => void;
  id: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ isOn, handleToggle, id }) => {
  return (
    <>
      <input
        checked={isOn}
        onChange={handleToggle}
        className="react-switch-checkbox"
        id={id}
        type="checkbox"
      />
      <label
        style={{ background: isOn ? '#22c55e' : '#a0aec0' }} // Using Tailwind green-500
        className="react-switch-label"
        htmlFor={id}
      >
        <span className={`react-switch-button`} />
      </label>
      <style>{`
        .react-switch-checkbox {
          height: 0;
          width: 0;
          visibility: hidden;
        }
        .react-switch-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          width: 48px;
          height: 26px;
          border-radius: 100px;
          position: relative;
          transition: background-color .2s;
        }
        .react-switch-label .react-switch-button {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          border-radius: 45px;
          transition: 0.2s;
          background: #fff;
          box-shadow: 0 0 2px 0 rgba(10, 10, 10, 0.29);
        }
        .react-switch-checkbox:checked + .react-switch-label .react-switch-button {
          left: calc(100% - 3px);
          transform: translateX(-100%);
        }
        .react-switch-label:active .react-switch-button {
          width: 26px;
        }
      `}</style>
    </>
  );
};
