import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, message, Grid } from 'antd';
import { UserOutlined, LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { login } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import LanguageSwitcher from '../components/layout/LanguageSwitcher';

const { Text } = Typography;

const NAVY  = '#0D1B2A';
const AMBER = '#C9973A';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);

  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  const language = localStorage.getItem('docarchive-lang') || 'ar';
  const isRtl = language === 'ar';

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const data = await login(values.username, values.password);
      setUser(data);
      navigate('/documents');
    } catch {
      message.error(t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      direction: isRtl ? 'rtl' : 'ltr',
      fontFamily: "'IBM Plex Sans', 'Cairo', sans-serif",
    }}>
      {/* ── Left / Brand Panel — hidden on mobile ──────── */}
      {!isMobile && (
        <div style={{
          width: '42%',
          minWidth: 320,
          background: NAVY,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 52px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background grid pattern */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.05,
            backgroundImage: 'repeating-linear-gradient(0deg, #fff 0, #fff 1px, transparent 0, transparent 40px), repeating-linear-gradient(90deg, #fff 0, #fff 1px, transparent 0, transparent 40px)',
            pointerEvents: 'none',
          }} />
          {/* Amber corner accent */}
          <div style={{
            position: 'absolute', bottom: -60, right: -60,
            width: 280, height: 280,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${AMBER}22 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          {/* Logo */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 8,
                background: `linear-gradient(135deg, ${AMBER} 0%, #A07828 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <SafetyCertificateOutlined style={{ color: '#fff', fontSize: 22 }} />
              </div>
              <div>
                <div style={{
                  color: '#fff', fontSize: 20, fontWeight: 700,
                  fontFamily: "'EB Garamond', serif",
                  letterSpacing: '0.02em',
                }}>
                  {isRtl ? 'نظام الأرشفة' : 'DocArchive'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  {isRtl ? 'إدارة الوثائق الرسمية' : 'Records Management System'}
                </div>
              </div>
            </div>

            <div>
              <h1 style={{
                color: '#fff',
                fontSize: isRtl ? 36 : 40,
                fontFamily: "'EB Garamond', serif",
                fontWeight: 500,
                lineHeight: 1.25,
                margin: '0 0 20px',
              }}>
                {isRtl ? 'أرشيف آمن\nوموثوق' : 'Secure\nDocument Vault'}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                {isRtl
                  ? 'نظام متكامل لإدارة وحفظ الوثائق الرسمية بأعلى معايير الأمان والكفاءة.'
                  : 'A complete system for managing and preserving official records with the highest standards of security and efficiency.'}
              </p>
            </div>
          </div>

          {/* Bottom stats */}
          <div style={{ display: 'flex', gap: 32 }}>
            {[
              { label: isRtl ? 'وثيقة محفوظة' : 'Records Stored', value: '∞' },
              { label: isRtl ? 'مستخدم نشط' : 'Active Users', value: '✓' },
              { label: isRtl ? 'آمن ومشفر' : 'Encrypted', value: '🔒' },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ color: AMBER, fontSize: 22, fontWeight: 700, fontFamily: "'EB Garamond', serif" }}>{s.value}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Right / Form Panel ─────────────────────────── */}
      <div style={{
        flex: 1,
        background: isMobile ? NAVY : '#F2F4F8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: isMobile ? 'center' : 'center',
        padding: isMobile ? '32px 20px' : '48px 40px',
        minHeight: '100vh',
      }}>
        {/* Compact brand header — mobile only */}
        {isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 10,
              background: `linear-gradient(135deg, ${AMBER} 0%, #A07828 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 12,
            }}>
              <SafetyCertificateOutlined style={{ color: '#fff', fontSize: 26 }} />
            </div>
            <div style={{ color: '#fff', fontSize: 22, fontWeight: 700, fontFamily: "'EB Garamond', serif", letterSpacing: '0.02em' }}>
              {isRtl ? 'نظام الأرشفة' : 'DocArchive'}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>
              {isRtl ? 'إدارة الوثائق الرسمية' : 'Records Management System'}
            </div>
          </div>
        )}

        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Form header */}
          <div style={{ marginBottom: isMobile ? 20 : 36 }}>
            <div style={{
              display: 'inline-block',
              background: isMobile ? 'rgba(201,151,58,0.2)' : `${AMBER}18`,
              border: `1px solid ${AMBER}44`,
              borderRadius: 4,
              padding: '3px 10px',
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: AMBER,
              fontWeight: 600,
              marginBottom: 12,
            }}>
              {isRtl ? 'تسجيل الدخول الآمن' : 'Secure Access'}
            </div>
            <h2 style={{
              margin: 0,
              fontSize: isMobile ? 24 : (isRtl ? 28 : 32),
              fontFamily: "'EB Garamond', serif",
              fontWeight: 500,
              color: isMobile ? '#fff' : NAVY,
              lineHeight: 1.2,
            }}>
              {t('auth.loginTitle')}
            </h2>
            <p style={{ margin: '8px 0 0', color: isMobile ? 'rgba(255,255,255,0.5)' : 'var(--vault-muted)', fontSize: 14 }}>
              {t('auth.loginSubtitle')}
            </p>
          </div>

          {/* Form */}
          <div style={{
            background: '#fff',
            borderRadius: 10,
            border: '1px solid var(--vault-border)',
            padding: isMobile ? '24px 20px 20px' : '32px 32px 24px',
            boxShadow: isMobile ? '0 8px 40px rgba(0,0,0,0.3)' : '0 4px 24px rgba(13,27,42,0.06)',
          }}>
            <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
              <Form.Item
                name="username"
                label={<span style={{ fontWeight: 600, fontSize: 13, color: NAVY }}>{t('auth.username')}</span>}
                rules={[{ required: true }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: 'var(--vault-muted)' }} />}
                  style={{ borderRadius: 6, borderColor: 'var(--vault-border)', background: '#F8F9FC' }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={<span style={{ fontWeight: 600, fontSize: 13, color: NAVY }}>{t('auth.password')}</span>}
                rules={[{ required: true }]}
                style={{ marginBottom: 24 }}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: 'var(--vault-muted)' }} />}
                  style={{ borderRadius: 6, borderColor: 'var(--vault-border)', background: '#F8F9FC' }}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  style={{
                    height: 44,
                    borderRadius: 6,
                    background: NAVY,
                    borderColor: NAVY,
                    fontWeight: 600,
                    fontSize: 14,
                    letterSpacing: '0.02em',
                  }}
                >
                  {t('auth.login')}
                </Button>
              </Form.Item>
            </Form>
          </div>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </div>
  );
}
