import React from 'react';
import { motion } from 'framer-motion';
import './CompanyInfo.css';

const CompanyInfo = ({ data, onTickerClick }) => {
  return (
    <motion.div
      className="company-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      key={data?.ticker}
    >
      <div className="company-header">
        <h1 className="company-title">{data?.companyName || 'Информация о компании'}</h1>
        <motion.button
          className="company-ticker"
          onClick={() => onTickerClick?.()}
          whileHover={{
            scale: 1.1,
            backgroundColor: "#dbeafe",
            boxShadow: "0px 4px 15px rgba(0, 0, 0, 0.15)",  // добавил красивую тень
          }}
          whileTap={{
            scale: 0.95,
            backgroundColor: "#c7d2fe"
          }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {data?.ticker || '—'}
        </motion.button>   {/* Закрытие тега button */}
      </div>

      {/* Восстановленное описание компании */}
      <motion.div
        className="company-description"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        transition={{ duration: 0.5 }}
      >
        {data?.description || 'Описание недоступно'}
      </motion.div>

      <div className="company-meta">
        <motion.div className="meta-item" initial="hidden" animate="visible">
          <span className="meta-label">Дата:</span>
          <span>{data?.date ? data.date.split(' ')[0] : '—'}</span>
        </motion.div>

        <motion.div className="meta-item" initial="hidden" animate="visible">
          <span className="meta-label">Время:</span>
          <span>{data?.time || '—'}</span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default React.memo(CompanyInfo);
