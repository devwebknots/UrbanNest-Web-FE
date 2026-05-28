import UrbanNestLogin from './UrbanNestLogin';

export default function UrbanNestLoginModal() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F0F2F5',
      backgroundImage: 'radial-gradient(circle, #CBD5E1 1px, transparent 1px)',
      backgroundSize: '28px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '75vw',
        maxHeight: '90vh',
        height: 'auto',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Inner scroll container so content never clips */}
        <div style={{
          overflowY: 'auto',
          flex: 1,
        }}>
          <UrbanNestLogin />
        </div>
      </div>
    </div>
  );
}
