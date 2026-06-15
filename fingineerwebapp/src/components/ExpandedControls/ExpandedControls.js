import React from 'react';
import PropTypes from 'prop-types';
import SearchForm from '../SearchForm';
import './ExpandedControls.css';

const ExpandedControls = ({
    query,
    onSearch,
    currentTimeframe,
    onSelectTimeframe,
    currentInterval,
    onSelectInterval,
    onToggleCalendar,
    onToggleIndicators,
    isExpanded = false,
}) => {
   return (
  <div className="expanded-controls">
    <div className="expanded-controls__search">
      <SearchForm
        onSearch={onSearch}
        isChartExpanded={true}
      />
    </div>
    <div className="expanded-controls__selectors">
      {isExpanded && (
  <button className="expanded-controls__btn" title="Календарь" onClick={onToggleCalendar}>
    📅
  </button>
)}

      <button className="expanded-controls__btn" title="Индикаторы" onClick={onToggleIndicators}>
        📊
      </button>
    </div>
  </div>
);
}

ExpandedControls.propTypes = {
    query: PropTypes.string,
    onSearch: PropTypes.func.isRequired,
    currentTimeframe: PropTypes.string.isRequired,
    onSelectTimeframe: PropTypes.func.isRequired,
    currentInterval: PropTypes.string.isRequired,
    onSelectInterval: PropTypes.func.isRequired,
    onToggleCalendar: PropTypes.func,
    onToggleIndicators: PropTypes.func,
    isExpanded: PropTypes.bool, // ← добавили
};

export default ExpandedControls;
