import React from 'react';
import { motion } from "framer-motion";
import './TickerInfoPanel.css';

const TickerInfoPanel = ({ ticker, details, onClose }) => {
  return (
    <motion.div
      className="ticker-panel"
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        scale: 1,
        transition: {
          type: "spring",
          damping: 20,
          stiffness: 300,
          duration: 0.5
        }
      }}
      exit={{ 
        opacity: 0, 
        x: 50,
        scale: 0.95,
        transition: { 
          duration: 0.3,
          ease: "easeInOut"
        } 
      }}
    >
      <motion.button
        className="close-btn"
        onClick={onClose}
        initial={{ opacity: 0, x: 10 }}
        animate={{ 
          opacity: 1, 
          x: 0,
          transition: { delay: 0.3 } 
        }}
        exit={{ opacity: 0 }}
        whileHover={{ 
          scale: 1.1,
          rotate: 90,
        }}
        whileTap={{ 
          scale: 0.9,
          rotate: 180
        }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        ×
      </motion.button>
      
      <motion.h2 
        className="ticker-title"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        Тикер: {ticker}
      </motion.h2>

      <motion.div 
        className="ticker-details"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p><strong>Сегмент:</strong> {details.sector}</p>
        <p><strong>Биржа:</strong> {details.exchange}</p>
        <p><strong>Дивиденды:</strong> {details.dividendYield}</p>
      </motion.div>
    </motion.div>
  );
};

export default React.memo(TickerInfoPanel);
