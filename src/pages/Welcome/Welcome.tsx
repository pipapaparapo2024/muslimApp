import React, { useState, useEffect } from 'react';
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

const phoneMock = (
  <div style={{width: '220px', height: '48px', background: '#eee', borderRadius: '6px 6px 0 0', margin: '0 auto', marginBottom: 12, display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 14}}>
    <span style={{flex: 1}}>12:48</span>
    <span style={{flex: 2, textAlign: 'center'}}>Title<br/>Bot</span>
    <span style={{flex: 1, textAlign: 'right'}}>●</span>
  </div>
);

export const Welcome: React.FC = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { tg } = useTelegram();

  useEffect(() => {
    if (localStorage.getItem('onboardingComplete')) {
      navigate('/home', { replace: true });
    }
    // Hide Telegram BackButton on onboarding
    if (tg?.BackButton) tg.BackButton.hide();
  }, [navigate, tg]);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      localStorage.setItem('onboardingComplete', '1');
      if (tg?.close) {
        tg.close(); // Try to close WebApp (if in Telegram)
      } else {
        navigate('/home', { replace: true });
      }
    }
  };

  return (
    <div style={{padding: 24, minHeight: '100vh', background: '#fff'}}>
      <div style={{display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 32}}>
        {steps.map((s, i) => (
          <div key={i} style={{width: 260, textAlign: 'center'}}>
            {phoneMock}
            <div style={{fontWeight: 600, marginBottom: 8, marginTop: 8}}>{s.title}</div>
            <div style={{fontSize: 15, color: '#444', marginBottom: 16}}>{s.desc}</div>
            <div style={{height: 32}}></div>
          </div>
        ))}
      </div>
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32}}>
        {steps.map((_, i) => (
          <div key={i} style={{width: 60, textAlign: 'center'}}>
            <div style={{margin: '0 auto', width: 40, height: 8, borderRadius: 4, background: i === step ? '#2e7d32' : '#e0e0e0', marginBottom: 12}}></div>
            {i === step && (
              <button
                style={{width: '100%', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 16, fontWeight: 500, cursor: 'pointer'}}
                onClick={handleNext}
              >
                {step === steps.length - 1 ? 'Start' : 'Next'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
