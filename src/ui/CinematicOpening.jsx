import React, { useState, useEffect } from 'react';

export default function CinematicOpening({ onComplete }) {
  const [currentSequence, setCurrentSequence] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const sequences = [
    {
      text: "SOMNUS DYNAMICS\nNEURAL INTERFACE DIVISION",
      subtitle: "LUCID SYSTEM v4.7.2",
      duration: 3000
    },
    {
      text: "PROTOCOL 12\nCOGNITIVE CONVERGENCE",
      subtitle: "RECONSTRUCTING MEMORY FRAGMENTS...",
      duration: 3000
    },
    {
      text: "SUBJECT 034\nDANIEL VALE",
      subtitle: "COGNITIVE STABILITY: 87%",
      duration: 2500
    },
    {
      text: "INTERVAL 01\nDISCONNECTION",
      subtitle: "BEGINNING NEURAL RECONSTRUCTION...",
      duration: 3000
    },
    {
      text: "WARNING",
      subtitle: "MEMORY STRUCTURE DOES NOT MATCH SUBJECT PROFILE",
      duration: 2500
    },
    {
      text: "WHO IS THE SECOND SUBJECT?",
      subtitle: "",
      duration: 3000
    }
  ];

  useEffect(() => {
    setIsVisible(true);
    
    const timer = setTimeout(() => {
      if (currentSequence < sequences.length - 1) {
        setIsVisible(false);
        setTimeout(() => {
          setCurrentSequence(prev => prev + 1);
          setIsVisible(true);
        }, 500);
      } else {
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    }, sequences[currentSequence].duration);

    return () => clearTimeout(timer);
  }, [currentSequence]);

  const sequence = sequences[currentSequence];

  return (
    <div 
      id="cinematic-opening" 
      className={isVisible ? 'active' : ''}
    >
      <div id="cinematic-text" className={isVisible ? 'visible' : ''}>
        {sequence.text.split('\n').map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
      {sequence.subtitle && (
        <div id="cinematic-subtitle" className={isVisible ? 'visible' : ''}>
          {sequence.subtitle}
        </div>
      )}
    </div>
  );
}
