import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelegram } from '../../hooks/useTelegram';

const steps = [
  {
    title: 'Prayer Reminders',
    desc: 'Stay on track with timely reminders for every prayer throughout the day.',
  },
  {
    title: 'Read the Quran',
    desc: 'Access the full Quran anytime, anywhere. Beautifully organized and easy to navigate.',
  },
  {
    title: 'Scan Your Food',
    desc: 'Quickly check if a product is halal or haram by scanning it — clear answers in seconds.',
  },
  {
    title: 'Get Trusted Religious Answers',
    desc: 'Receive accurate, reliable responses to help you confidently understand your faith.',
  },
];

export const Welcome: React.FC = () => {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<'right' | null>(null);
  const navigate = useNavigate();
  const { tg } = useTelegram();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Always show onboarding for testing, so skip localStorage check
    if (tg?.BackButton) tg.BackButton.hide();
  }, [tg]);

  // Touch/Swipe logic
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let startX = 0;
    let endX = 0;
    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };
    const onTouchEnd = (e: TouchEvent) => {
      endX = e.changedTouches[0].clientX;
      if (endX - startX > 60 && step > 0) {
        setDirection(null); // No left swipe
        setStep(s => s - 1);
      } else if (startX - endX > 60 && step < steps.length - 1) {
        handleNext();
      }
    };
    container.addEventListener('touchstart', onTouchStart);
    container.addEventListener('touchend', onTouchEnd);
    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [step]);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setDirection('right');
      setAnimating(true);
      setTimeout(() => {
        setStep(s => s + 1);
        setAnimating(false);
        setDirection(null);
      }, 300);
    } else {
      // localStorage.setItem('onboardingComplete', '1'); // Skip for testing
      navigate('/home', { replace: true });
    }
  };

  return (
    <div ref={containerRef} style={{padding: 24, minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
      <div style={{position: 'relative', width: 320, height: 220, marginBottom: 40, overflow: 'hidden'}}>
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            transition: animating ? 'transform 0.3s cubic-bezier(.4,0,.2,1)' : 'none',
            transform: animating && direction === 'right' ? 'translateX(-100%)' : 'translateX(0)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 2px 16px rgba(0,0,0,0.04)'
          }}
        >
          <div style={{fontWeight: 700, fontSize: 22, marginBottom: 12, textAlign: 'center'}}>{steps[step].title}</div>
          <div style={{fontSize: 16, color: '#444', textAlign: 'center'}}>{steps[step].desc}</div>
        </div>
      </div>
      <div style={{display: 'flex', gap: 8, marginBottom: 24}}>
        {steps.map((_, i) => (
          <div key={i} style={{width: 12, height: 12, borderRadius: '50%', background: i === step ? '#2e7d32' : '#e0e0e0'}}></div>
        ))}
      </div>
      <button
        style={{width: 260, background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 0', fontSize: 18, fontWeight: 600, cursor: 'pointer', marginTop: 8}}
        onClick={handleNext}
      >
        {step === steps.length - 1 ? 'Start' : 'Next'}
      </button>
    </div>
  );
};
