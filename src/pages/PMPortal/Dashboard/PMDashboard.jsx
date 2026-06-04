/**
 * PMDashboard.jsx — PM Portal: My Dashboard
 * Route:   /pm-portal/dashboard/my-dashboard
 * Session: 7 — May 30, 2026
 * Changes: Added useLocation + SampleBanner for ?mode=sample support.
 *          Everything else identical to the file on disk.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CustomDropdown, Button } from '../../../components/ui';
import NavB from '../../../components/layout/NavB';

if (typeof document !== 'undefined' && !document.getElementById('tabler-icons-cdn')) {
  const l = document.createElement('link');
  l.id = 'tabler-icons-cdn'; l.rel = 'stylesheet';
  l.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css';
  document.head.appendChild(l);
}

const C = {
  primary:'#002D5B', primaryHover:'#003d7a', navBg:'#111827',
  pageBg:'#F1F5F9', border:'#E2E8F0', borderMedium:'#CBD5E1',
  textPrimary:'#0F172A', textSecondary:'#64748B', textTertiary:'#94A3B8',
  white:'#FFFFFF', neutral:'#F8FAFC', green:'#16A34A', greenBg:'#DCFCE7',
  danger:'#E53E3E', dangerBg:'#FEE2E2', amber:'#D97706', amberBg:'#FEF3C7',
  amberBorder:'#FCD34D', amberText:'#92400E', navyCard:'#1a2332',
  contextBg:'#EEF2FF', contextBorder:'#C7D2FE',
};
const F = { headline:"'Noto Serif', serif", body:"'Nunito Sans', sans-serif" };

function decodeJWT(token) {
  try { return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))); }
  catch { return null; }
}

const MOCK_METRICS = {
  totalUnits:24, totalProperties:6, occupancyRate:87.5, occupancyTrend:2.3,
  revenueMTD:18420, collectionRate:94, openMaintenance:7, overdueCount:2,
};
const MOCK_LEASING = [
  {label:'Active Leads',value:12,danger:false},{label:'Applications',value:4,danger:false},
  {label:'Expiring Leases',value:3,danger:true},{label:'Avg Days',value:18,danger:false},
];
const MOCK_SNAPSHOT = [
  {label:'Residential',value:14,color:'#002D5B'},{label:'Commercial',value:5,color:'#16A34A'},
  {label:'Student Housing',value:3,color:'#D97706'},{label:'Short-term',value:2,color:'#7C3AED'},
];
const MOCK_ACTIVITY = [
  {icon:'ti-user-check',text:'New tenant signed lease',sub:'12 Maple St, Unit 4B',time:'2h ago',color:'#16A34A'},
  {icon:'ti-tool',text:'Maintenance request submitted',sub:'88 Oak Ave, Unit 2A',time:'4h ago',color:'#D97706'},
  {icon:'ti-cash',text:'Rent payment received',sub:'34 Pine Rd, Unit 1C',time:'5h ago',color:'#002D5B'},
  {icon:'ti-alert-circle',text:'Lease expiring in 30 days',sub:'7 Elm St, Unit 3D',time:'1d ago',color:'#E53E3E'},
  {icon:'ti-file-plus',text:'New application submitted',sub:'22 Cedar Ln, Unit 5A',time:'1d ago',color:'#002D5B'},
];
const MOCK_TRANSACTIONS = [
  {property:'12 Maple St',type:'Rent Received',amount:'+$1,450',color:'#16A34A',bg:'#DCFCE7'},
  {property:'88 Oak Ave',type:'Vendor Invoice',amount:'-$320',color:'#E53E3E',bg:'#FEE2E2'},
  {property:'34 Pine Rd',type:'Rent Received',amount:'+$2,100',color:'#16A34A',bg:'#DCFCE7'},
  {property:'7 Elm St',type:'Rent Overdue',amount:'$1,200',color:'#D97706',bg:'#FEF3C7'},
  {property:'22 Cedar Ln',type:'Management Fee',amount:'+$184',color:'#16A34A',bg:'#DCFCE7'},
  {property:'15 Birch Blvd',type:'Maintenance Cost',amount:'-$540',color:'#E53E3E',bg:'#FEE2E2'},
];
const MOCK_PROPERTIES = [
  {id:'prop-1',name:'12 Maple Street',address:'Austin, TX 78701',type:'For Rent',price:'$1,450/mo',units:4,occupancy:100,city:'austin',img:'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&q=80'},
  {id:'prop-2',name:'88 Oak Avenue',address:'Austin, TX 78704',type:'For Sale',price:'$425,000',units:6,occupancy:83,city:'austin',img:'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&q=80'},
  {id:'prop-3',name:'34 Pine Road',address:'Austin, TX 78702',type:'For Rent',price:'$2,100/mo',units:2,occupancy:100,city:'austin',img:'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&q=80'},
  {id:'prop-4',name:'7 Elm Street',address:'Dallas, TX 75201',type:'For Sale',price:'$310,000',units:3,occupancy:67,city:'dallas',img:'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80'},
  {id:'prop-5',name:'22 Cedar Lane',address:'Dallas, TX 75202',type:'For Rent',price:'$1,800/mo',units:5,occupancy:80,city:'dallas',img:'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=80'},
  {id:'prop-6',name:'15 Birch Blvd',address:'Houston, TX 77001',type:'For Buy',price:'$290,000',units:4,occupancy:75,city:'houston',img:'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80'},
];
const DATE_TABS = ['Today','This week','This month','Custom range'];

// ─── Sample Banner ← NEW Session 7 ────────────────────────────────────────────
// Shown above page title when ?mode=sample is in the URL.
// Matches Figma: pale green bg, info icon, bold title, muted subtitle.
function SampleBanner({ onBack }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px',
      background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:'8px',
      padding:'12px 16px', marginBottom:'16px',
    }}>
      <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
        <i className="ti ti-info-circle" style={{fontSize:'18px', color:'#16A34A', flexShrink:0}}/>
        <div>
          <p style={{margin:0, fontFamily:F.body, fontSize:'13px', fontWeight:700, color:'#14532D'}}>
            This is a sample view — data shown is not real
          </p>
          <p style={{margin:0, fontFamily:F.body, fontSize:'12px', color:'#166534'}}>
            Add your first property to see your actual dashboard
          </p>
        </div>
      </div>
      <button onClick={onBack}
        style={{flexShrink:0, display:'flex', alignItems:'center', gap:'5px', background:C.white, border:'1px solid #BBF7D0', borderRadius:'6px', padding:'6px 12px', fontFamily:F.body, fontSize:'12px', fontWeight:600, color:'#166634', cursor:'pointer', whiteSpace:'nowrap'}}
        onMouseEnter={e => e.currentTarget.style.background = '#DCFCE7'}
        onMouseLeave={e => e.currentTarget.style.background = C.white}
      >
        <i className="ti ti-arrow-left" style={{fontSize:'13px'}}/>
        Back to getting started
      </button>
    </div>
  );
}

function MiniSelector({options,value,onChange}){
  const [open,setOpen]=useState(false);const ref=useRef();
  const selected=options.find(o=>o.value===value);
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h)},[]);
  return(
    <div ref={ref} style={{position:'relative'}}>
      <div onClick={()=>setOpen(p=>!p)} style={{display:'flex',alignItems:'center',gap:'5px',padding:'4px 10px',background:value?C.contextBg:C.neutral,border:'1px solid '+(value?C.contextBorder:C.borderMedium),borderRadius:'20px',cursor:'pointer',whiteSpace:'nowrap'}}>
        <span style={{fontFamily:F.body,fontSize:'12px',fontWeight:value?600:400,color:value?C.primary:C.textSecondary}}>{selected?.label||options[0]?.label}</span>
        <i className={`ti ${open?'ti-chevron-up':'ti-chevron-down'}`} style={{fontSize:'11px',color:value?C.primary:C.textTertiary}}/>
      </div>
      {open&&<div style={{position:'absolute',top:'calc(100% + 4px)',left:0,zIndex:200,background:C.white,border:'1px solid '+C.contextBorder,borderRadius:'8px',boxShadow:'0 4px 12px rgba(0,45,91,0.10)',minWidth:'140px',overflow:'hidden'}}>
        {options.map(o=><div key={o.value} onClick={()=>{onChange(o.value);setOpen(false)}} style={{padding:'8px 12px',fontFamily:F.body,fontSize:'12px',color:o.value===value?C.primary:C.textPrimary,background:o.value===value?C.contextBg:C.white,fontWeight:o.value===value?600:400,cursor:'pointer'}} onMouseEnter={e=>{if(o.value!==value)e.currentTarget.style.background='#F0F5FF'}} onMouseLeave={e=>{if(o.value!==value)e.currentTarget.style.background=C.white}}>{o.label}</div>)}
      </div>}
    </div>
  );
}

function Header({userName,userRole}){
  return(
    <div style={{height:'60px',flexShrink:0,background:C.white,borderBottom:'1px solid '+C.border,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 clamp(20px,3vw,36px)'}}>
      <div style={{display:'flex',alignItems:'center',gap:'8px',background:C.neutral,borderRadius:'8px',padding:'0 14px',height:'36px',width:'280px'}}>
        <i className="ti ti-search" style={{fontSize:'14px',color:C.textTertiary}}/>
        <input type="text" placeholder="Search properties, tenants, or help…" style={{background:'none',border:'none',outline:'none',fontFamily:F.body,fontSize:'12px',color:C.textSecondary,width:'100%'}}/>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
        <div style={{position:'relative',cursor:'pointer'}}>
          <i className="ti ti-bell" style={{fontSize:'18px',color:C.textSecondary}}/>
          <div style={{position:'absolute',top:'-2px',right:'-2px',width:'7px',height:'7px',borderRadius:'50%',background:C.danger,border:'1.5px solid '+C.white}}/>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'10px',paddingLeft:'12px',borderLeft:'1px solid '+C.border}}>
          <div style={{textAlign:'right'}}>
            <p style={{margin:0,fontFamily:F.body,fontSize:'13px',fontWeight:600,color:C.textPrimary}}>{userName}</p>
            <p style={{margin:0,fontFamily:F.body,fontSize:'9px',color:C.textTertiary,textTransform:'uppercase',letterSpacing:'0.06em'}}>{userRole}</p>
          </div>
          <div style={{width:'34px',height:'34px',borderRadius:'50%',background:C.primary,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <i className="ti ti-user" style={{fontSize:'16px',color:C.white}}/>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({icon,accentColor,label,value,sub,trend,subDanger}){
  return(
    <div style={{background:C.white,border:'1px solid '+C.border,borderRadius:'12px',padding:'12px 16px',flex:1,minWidth:0,borderLeft:`3px solid ${accentColor}`,display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginBottom:'8px',width:'100%'}}>
        <div style={{width:'30px',height:'30px',borderRadius:'7px',background:accentColor+'18',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <i className={`ti ${icon}`} style={{fontSize:'15px',color:accentColor}}/>
        </div>
        {trend!==undefined&&<div style={{display:'flex',alignItems:'center',gap:'3px',background:trend>0?C.greenBg:C.dangerBg,borderRadius:'20px',padding:'2px 7px'}}>
          <i className={`ti ${trend>0?'ti-trending-up':'ti-trending-down'}`} style={{fontSize:'10px',color:trend>0?C.green:C.danger}}/>
          <span style={{fontFamily:F.body,fontSize:'10px',fontWeight:600,color:trend>0?C.green:C.danger}}>{Math.abs(trend)}%</span>
        </div>}
      </div>
      <p style={{margin:'0 0 2px',fontFamily:F.body,fontSize:'10px',color:C.textTertiary,textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:600}}>{label}</p>
      <p style={{margin:'0 0 3px',fontFamily:F.headline,fontSize:'clamp(18px,1.8vw,22px)',fontWeight:700,color:C.textPrimary,lineHeight:1.1}}>{value}</p>
      <p style={{margin:0,fontFamily:F.body,fontSize:'11px',color:subDanger?C.danger:C.textSecondary,fontWeight:subDanger?600:400}}>{sub}</p>
    </div>
  );
}

function LeasingActivityCard(){
  return(
    <div style={{background:C.white,border:'1px solid '+C.border,borderRadius:'12px',padding:'12px 14px',display:'flex',flexDirection:'column',gap:'6px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <p style={{margin:'0 0 1px',fontFamily:F.headline,fontSize:'14px',fontWeight:700,color:C.textPrimary}}>Leasing Activity</p>
          <p style={{margin:0,fontFamily:F.body,fontSize:'11px',color:C.textTertiary}}>Current pipeline overview</p>
        </div>
        <span style={{background:C.primary,color:C.white,fontFamily:F.body,fontSize:'9px',fontWeight:700,borderRadius:'20px',padding:'2px 8px',letterSpacing:'0.04em'}}>LIVE</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'7px',marginTop:'28px'}}>
        {MOCK_LEASING.map(item=>(
          <div key={item.label} style={{background:C.pageBg,borderRadius:'8px',padding:'6px 8px',textAlign:'center'}}>
            <p style={{margin:'0 0 2px',fontFamily:F.body,fontSize:'9px',fontWeight:700,color:C.textTertiary,textTransform:'uppercase',letterSpacing:'0.06em'}}>{item.label}</p>
            <p style={{margin:0,fontFamily:F.headline,fontSize:'16px',fontWeight:700,color:item.danger?C.danger:C.textPrimary}}>{item.value}</p>
          </div>
        ))}
      </div>
      <div style={{marginTop:'2px'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
          <span style={{fontFamily:F.body,fontSize:'11px',color:C.textSecondary}}>Lease Cycle Efficiency</span>
          <span style={{fontFamily:F.body,fontSize:'11px',fontWeight:600,color:C.textPrimary}}>18 days</span>
        </div>
        <div style={{height:'5px',background:C.border,borderRadius:'99px',overflow:'hidden'}}>
          <div style={{width:'60%',height:'100%',background:C.primary,borderRadius:'99px'}}/>
        </div>
      </div>
    </div>
  );
}

function PropertySnapshotCard(){
  const total=MOCK_SNAPSHOT.reduce((s,i)=>s+i.value,0);
  const r=38,circ=2*Math.PI*r;let offset=0;
  const segments=MOCK_SNAPSHOT.map(item=>{const dash=(item.value/total)*circ;const seg={...item,dash,offset};offset+=dash;return seg;});
  return(
    <div style={{background:C.white,border:'1px solid '+C.border,borderRadius:'12px',padding:'12px 14px',display:'flex',flexDirection:'column'}}>
      <div style={{marginBottom:'16px'}}>
        <p style={{margin:'0 0 1px',fontFamily:F.headline,fontSize:'14px',fontWeight:700,color:C.textPrimary}}>Property Snapshot</p>
        <p style={{margin:0,fontFamily:F.body,fontSize:'11px',color:C.textTertiary}}>Portfolio by type</p>
      </div>
      <div style={{display:'flex',justifyContent:'center',marginBottom:'16px'}}>
        <div style={{position:'relative',flexShrink:0}}>
          <svg width="90" height="90" viewBox="0 0 90 90">
            <circle cx="45" cy="45" r={r} fill="none" stroke={C.border} strokeWidth="12"/>
            {segments.map((seg,i)=><circle key={i} cx="45" cy="45" r={r} fill="none" stroke={seg.color} strokeWidth="12" strokeDasharray={`${seg.dash} ${circ-seg.dash}`} strokeDashoffset={-(seg.offset-circ/4)} transform="rotate(-90 45 45)"/>)}
          </svg>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <span style={{fontFamily:F.headline,fontSize:'18px',fontWeight:700,color:C.textPrimary,lineHeight:1}}>{total}</span>
            <span style={{fontFamily:F.body,fontSize:'8px',color:C.textTertiary,textTransform:'uppercase',letterSpacing:'0.06em'}}>TOTAL</span>
          </div>
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {MOCK_SNAPSHOT.map(item=>(
          <div key={item.label} style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
              <div style={{width:'8px',height:'8px',borderRadius:'50%',background:item.color,flexShrink:0}}/>
              <span style={{fontFamily:F.body,fontSize:'12px',color:C.textSecondary}}>{item.label}</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <div style={{flex:1,width:'60px',height:'4px',background:C.border,borderRadius:'99px',overflow:'hidden'}}>
                <div style={{width:`${(item.value/total)*100}%`,height:'100%',background:item.color,borderRadius:'99px'}}/>
              </div>
              <span style={{fontFamily:F.body,fontSize:'12px',fontWeight:600,color:C.textPrimary,minWidth:'16px',textAlign:'right'}}>{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FinancialPulseCard(){
  const {revenueMTD,collectionRate}=MOCK_METRICS;
  const expenses=5840,pendingRent=1200,noi=revenueMTD-expenses;
  const rows=[
    {label:'Revenue MTD',value:`$${revenueMTD.toLocaleString()}`,color:C.white,accentColor:'rgba(255,255,255,0.3)',icon:'ti-arrow-up-right'},
    {label:'Expenses MTD',value:`($${expenses.toLocaleString()})`,color:'rgba(255,255,255,0.65)',accentColor:'rgba(251,191,36,0.45)',icon:'ti-arrow-down-right'},
    {label:'Net Income (NOI)',value:`$${noi.toLocaleString()}`,color:'#4ade80',accentColor:'rgba(74,222,128,0.55)',icon:'ti-check'},
    {label:'Pending Rent',value:`$${pendingRent.toLocaleString()}`,color:'#fbbf24',accentColor:'rgba(251,191,36,0.55)',icon:'ti-clock'},
  ];
  return(
    <div style={{background:C.navyCard,border:'1px solid rgba(255,255,255,0.06)',borderRadius:'12px',padding:'16px',display:'flex',flexDirection:'column',gap:'10px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <p style={{margin:'0 0 1px',fontFamily:F.headline,fontSize:'14px',fontWeight:700,color:C.white}}>Financial Pulse</p>
          <p style={{margin:0,fontFamily:F.body,fontSize:'11px',color:'rgba(255,255,255,0.4)'}}>Month to date</p>
        </div>
        <div style={{background:'rgba(74,222,128,0.15)',border:'1px solid rgba(74,222,128,0.3)',borderRadius:'20px',padding:'2px 8px',display:'flex',alignItems:'center',gap:'4px'}}>
          <i className="ti ti-trending-up" style={{fontSize:'10px',color:'#4ade80'}}/>
          <span style={{fontFamily:F.body,fontSize:'9px',fontWeight:700,color:'#4ade80',letterSpacing:'0.04em'}}>{collectionRate}% COLLECTED</span>
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'5px'}}>
        {rows.map(row=>(
          <div key={row.label} style={{background:'rgba(255,255,255,0.06)',borderRadius:'0 7px 7px 0',borderLeft:`3px solid ${row.accentColor}`,padding:'8px 10px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <p style={{margin:'0 0 2px',fontFamily:F.body,fontSize:'9px',fontWeight:700,color:'rgba(255,255,255,0.4)',textTransform:'uppercase',letterSpacing:'0.07em'}}>{row.label}</p>
              <p style={{margin:0,fontFamily:F.headline,fontSize:'clamp(14px,1.4vw,17px)',fontWeight:700,color:row.color}}>{row.value}</p>
            </div>
            <i className={`ti ${row.icon}`} style={{fontSize:'15px',color:row.accentColor}}/>
          </div>
        ))}
      </div>
      <div>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
          <span style={{fontFamily:F.body,fontSize:'10px',color:'rgba(255,255,255,0.35)',textTransform:'uppercase',letterSpacing:'0.06em'}}>Collection Rate</span>
          <span style={{fontFamily:F.body,fontSize:'10px',fontWeight:600,color:'rgba(255,255,255,0.6)'}}>{collectionRate}%</span>
        </div>
        <div style={{height:'4px',background:'rgba(255,255,255,0.1)',borderRadius:'99px',overflow:'hidden'}}>
          <div style={{width:`${collectionRate}%`,height:'100%',background:'#4ade80',borderRadius:'99px'}}/>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'7px'}}>
        <Button variant="secondary" fullWidth={false} style={{height:'32px',fontSize:'11px',color:C.white,borderColor:'rgba(255,255,255,0.2)',background:'rgba(255,255,255,0.08)',width:'100%'}}>View P&L</Button>
        <Button variant="primary" fullWidth={false} style={{height:'32px',fontSize:'11px',background:C.green,width:'100%'}}>Export</Button>
      </div>
    </div>
  );
}

function RecentActivityCard(){
  return(
    <div style={{background:C.white,border:'1px solid '+C.border,borderRadius:'12px',padding:'16px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'12px'}}>
        <div style={{width:'30px',height:'30px',borderRadius:'7px',background:C.contextBg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <i className="ti ti-history" style={{fontSize:'15px',color:C.primary}}/>
        </div>
        <div>
          <p style={{margin:'0 0 1px',fontFamily:F.headline,fontSize:'14px',fontWeight:700,color:C.textPrimary}}>Recent Activity</p>
          <p style={{margin:0,fontFamily:F.body,fontSize:'11px',color:C.textTertiary}}>Latest events across your portfolio</p>
        </div>
      </div>
      <div>
        {MOCK_ACTIVITY.map((item,idx)=>(
          <div key={idx} style={{display:'flex',alignItems:'flex-start',gap:'10px',padding:'8px 0',borderBottom:idx<MOCK_ACTIVITY.length-1?'1px solid '+C.border:'none'}}>
            <div style={{width:'26px',height:'26px',borderRadius:'6px',flexShrink:0,background:item.color+'18',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <i className={`ti ${item.icon}`} style={{fontSize:'12px',color:item.color}}/>
            </div>
            <div style={{flex:1,minWidth:0}}>
              <p style={{margin:'0 0 1px',fontFamily:F.body,fontSize:'12px',fontWeight:600,color:C.textPrimary}}>{item.text}</p>
              <p style={{margin:0,fontFamily:F.body,fontSize:'11px',color:C.textTertiary}}>{item.sub}</p>
            </div>
            <span style={{fontFamily:F.body,fontSize:'10px',color:C.textTertiary,flexShrink:0}}>{item.time}</span>
          </div>
        ))}
      </div>
      <div style={{marginTop:'10px',paddingTop:'8px',borderTop:'1px solid '+C.border,textAlign:'center'}}>
        <span style={{fontFamily:F.body,fontSize:'11px',fontWeight:700,color:C.primary,cursor:'pointer',letterSpacing:'0.03em'}}>VIEW ALL ACTIVITY</span>
      </div>
    </div>
  );
}

function RecentTransactionsCard(){
  const [txFilter,setTxFilter]=useState('All');const [filterOpen,setFilterOpen]=useState(false);const filterRef=useRef();
  const TYPES=['All','Rent Received','Vendor Invoice','Rent Overdue','Management Fee','Maintenance Cost'];
  useEffect(()=>{const h=e=>{if(filterRef.current&&!filterRef.current.contains(e.target))setFilterOpen(false)};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h)},[]);
  const filtered=txFilter==='All'?MOCK_TRANSACTIONS:MOCK_TRANSACTIONS.filter(t=>t.type===txFilter);
  return(
    <div style={{background:C.white,border:'1px solid '+C.border,borderRadius:'12px',padding:'16px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'30px',height:'30px',borderRadius:'7px',background:C.greenBg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <i className="ti ti-receipt" style={{fontSize:'15px',color:C.green}}/>
          </div>
          <div>
            <p style={{margin:'0 0 1px',fontFamily:F.headline,fontSize:'14px',fontWeight:700,color:C.textPrimary}}>Recent Transactions</p>
            <p style={{margin:0,fontFamily:F.body,fontSize:'11px',color:C.textTertiary}}>Money-related activity</p>
          </div>
        </div>
        <div ref={filterRef} style={{position:'relative'}}>
          <div onClick={()=>setFilterOpen(p=>!p)} style={{width:'28px',height:'28px',borderRadius:'6px',border:'1px solid '+(txFilter!=='All'?C.primary:C.borderMedium),background:txFilter!=='All'?C.contextBg:C.white,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
            <i className="ti ti-adjustments-horizontal" style={{fontSize:'13px',color:txFilter!=='All'?C.primary:C.textSecondary}}/>
          </div>
          {filterOpen&&<div style={{position:'absolute',top:'calc(100% + 4px)',right:0,zIndex:200,background:C.white,border:'1px solid '+C.contextBorder,borderRadius:'8px',boxShadow:'0 4px 12px rgba(0,45,91,0.10)',minWidth:'160px',overflow:'hidden'}}>
            {TYPES.map(t=><div key={t} onClick={()=>{setTxFilter(t);setFilterOpen(false)}} style={{padding:'8px 12px',fontFamily:F.body,fontSize:'12px',color:t===txFilter?C.primary:C.textPrimary,background:t===txFilter?C.contextBg:C.white,fontWeight:t===txFilter?600:400,cursor:'pointer'}} onMouseEnter={e=>{if(t!==txFilter)e.currentTarget.style.background='#F0F5FF'}} onMouseLeave={e=>{if(t!==txFilter)e.currentTarget.style.background=C.white}}>{t}</div>)}
          </div>}
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:'8px',padding:'0 0 6px',borderBottom:'1px solid '+C.border,marginBottom:'4px'}}>
        {['Property','Type','Amount'].map(h=><span key={h} style={{fontFamily:F.body,fontSize:'10px',fontWeight:700,color:C.textTertiary,textTransform:'uppercase',letterSpacing:'0.06em'}}>{h}</span>)}
      </div>
      {filtered.map((tx,idx)=>(
        <div key={idx} style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:'8px',alignItems:'center',padding:'8px 0',borderBottom:idx<filtered.length-1?'1px solid '+C.border:'none'}}>
          <span style={{fontFamily:F.body,fontSize:'12px',color:C.textPrimary,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tx.property}</span>
          <span style={{fontFamily:F.body,fontSize:'11px',color:C.textSecondary,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tx.type}</span>
          <span style={{fontFamily:F.body,fontSize:'12px',fontWeight:700,color:tx.color,background:tx.bg,borderRadius:'5px',padding:'2px 7px',whiteSpace:'nowrap'}}>{tx.amount}</span>
        </div>
      ))}
    </div>
  );
}

function PropertyPanel({properties,onClose}){
  const [selectedId,setSelectedId]=useState(properties[0]?.id||null);
  const [propFilter,setPropFilter]=useState('All');const [filterOpen,setFilterOpen]=useState(false);const filterRef=useRef();
  const TYPES=['All','For Rent','For Sale','For Buy'];
  useEffect(()=>{const h=e=>{if(filterRef.current&&!filterRef.current.contains(e.target))setFilterOpen(false)};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h)},[]);
  const filtered=propFilter==='All'?properties:properties.filter(p=>p.type===propFilter);
  const typeBadge=type=>{if(type==='For Rent')return{bg:C.greenBg,color:C.green};if(type==='For Sale')return{bg:C.contextBg,color:C.primary};return{bg:'#EDE9FE',color:'#5B21B6'};};
  const occColor=pct=>pct>=90?C.green:pct>=70?C.amber:C.danger;
  return(
    <div style={{width:'240px',minWidth:'200px',background:C.white,borderLeft:'1px solid '+C.border,display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{padding:'12px 14px 8px',borderBottom:'1px solid '+C.border,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'2px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'7px'}}>
            <span style={{fontFamily:F.headline,fontSize:'13px',fontWeight:700,color:C.textPrimary}}>My Property(s)</span>
            <span style={{background:C.contextBg,color:C.primary,fontFamily:F.body,fontSize:'10px',fontWeight:700,borderRadius:'99px',padding:'1px 7px'}}>{filtered.length}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
            <div ref={filterRef} style={{position:'relative'}}>
              <div onClick={()=>setFilterOpen(p=>!p)} style={{width:'24px',height:'24px',borderRadius:'5px',border:'1px solid '+(propFilter!=='All'?C.primary:C.borderMedium),background:propFilter!=='All'?C.contextBg:C.white,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                <i className="ti ti-adjustments-horizontal" style={{fontSize:'12px',color:propFilter!=='All'?C.primary:C.textSecondary}}/>
              </div>
              {filterOpen&&<div style={{position:'absolute',top:'calc(100% + 4px)',right:0,zIndex:200,background:C.white,border:'1px solid '+C.contextBorder,borderRadius:'8px',boxShadow:'0 4px 12px rgba(0,45,91,0.10)',minWidth:'130px',overflow:'hidden'}}>
                {TYPES.map(t=><div key={t} onClick={()=>{setPropFilter(t);setFilterOpen(false)}} style={{padding:'7px 12px',fontFamily:F.body,fontSize:'12px',color:t===propFilter?C.primary:C.textPrimary,background:t===propFilter?C.contextBg:C.white,fontWeight:t===propFilter?600:400,cursor:'pointer'}} onMouseEnter={e=>{if(t!==propFilter)e.currentTarget.style.background='#F0F5FF'}} onMouseLeave={e=>{if(t!==propFilter)e.currentTarget.style.background=C.white}}>{t}</div>)}
              </div>}
            </div>
            <div onClick={onClose} style={{width:'24px',height:'24px',borderRadius:'5px',background:C.pageBg,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
              <i className="ti ti-x" style={{fontSize:'11px',color:C.textSecondary}}/>
            </div>
          </div>
        </div>
        <p style={{margin:0,fontFamily:F.body,fontSize:'11px',color:C.textTertiary}}>{properties.length===MOCK_PROPERTIES.length?'All cities · All':'Current filter'}</p>
      </div>
      <div className="prop-scroll" style={{flex:1,overflowY:'auto',padding:'10px'}}>
        {filtered.length===0&&<p style={{textAlign:'center',fontFamily:F.body,fontSize:'12px',color:C.textTertiary,marginTop:'24px'}}>No properties match this filter.</p>}
        {filtered.map(prop=>{const badge=typeBadge(prop.type);const isSelected=prop.id===selectedId;return(
          <div key={prop.id} onClick={()=>setSelectedId(prop.id)} style={{border:isSelected?`1.5px solid ${C.primary}`:'1px solid '+C.border,borderRadius:'10px',overflow:'hidden',marginBottom:'10px',cursor:'pointer',background:C.white}}>
            <div style={{position:'relative',height:'90px',overflow:'hidden',background:C.pageBg}}>
              <img src={prop.img} alt={prop.name} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} onError={e=>{e.target.style.display='none'}}/>
              <div style={{position:'absolute',top:'6px',right:'6px',background:badge.bg,color:badge.color,fontFamily:F.body,fontSize:'9px',fontWeight:700,borderRadius:'20px',padding:'2px 7px'}}>{prop.type}</div>
            </div>
            <div style={{padding:'9px 11px'}}>
              <p style={{margin:'0 0 2px',fontFamily:F.headline,fontSize:'12px',fontWeight:700,color:C.textPrimary}}>{prop.name}</p>
              <p style={{margin:'0 0 7px',fontFamily:F.body,fontSize:'10px',color:C.textTertiary}}>{prop.address}</p>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <span style={{fontFamily:F.headline,fontSize:'13px',fontWeight:700,color:C.primary}}>{prop.price}</span>
                <div style={{display:'flex',gap:'4px'}}>
                  <span style={{background:C.pageBg,color:C.textSecondary,fontFamily:F.body,fontSize:'9px',fontWeight:600,borderRadius:'4px',padding:'2px 5px'}}>{prop.units} UNT</span>
                  <span style={{background:occColor(prop.occupancy)+'18',color:occColor(prop.occupancy),fontFamily:F.body,fontSize:'9px',fontWeight:700,borderRadius:'4px',padding:'2px 5px'}}>{prop.occupancy}%</span>
                </div>
              </div>
            </div>
          </div>
        );})}
      </div>
      <div style={{flexShrink:0,padding:'8px 12px',borderTop:'1px solid '+C.border}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',padding:'7px',borderRadius:'7px',border:'1px solid '+C.borderMedium,cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.background=C.pageBg} onMouseLeave={e=>e.currentTarget.style.background=C.white}>
          <i className="ti ti-building" style={{fontSize:'12px',color:C.primary}}/>
          <span style={{fontFamily:F.body,fontSize:'11px',fontWeight:600,color:C.primary}}>View all properties</span>
        </div>
      </div>
    </div>
  );
}

function FilterPanel({open,onClose,filters,setFilters,moduleToggles,setModuleToggles}){
  const PROPERTY_TYPES=['Residential','Commercial','Student Housing','Short-term','Mixed'];
  const OCCUPANCY_STATUS=['Occupied','Vacant','Notice Given','Under Maintenance'];
  const MAINT_PRIORITY=['Emergency','High','Medium','Low'];
  const MODULES=['Leasing Activity','Property Snapshot','Financial Pulse','Recent Activity','Recent Transactions'];
  const toggleChip=(key,val)=>setFilters(prev=>{const arr=prev[key]||[];return{...prev,[key]:arr.includes(val)?arr.filter(v=>v!==val):[...arr,val]};});
  const handleReset=()=>{setFilters({propertyTypes:[],occupancyStatus:[],maintPriority:[]});setModuleToggles(Object.fromEntries(MODULES.map(m=>[m,true])));};
  const ChipGroup=({label,filterKey,chips})=>(
    <div style={{marginBottom:'18px'}}>
      <p style={{margin:'0 0 8px',fontFamily:F.body,fontSize:'10px',fontWeight:700,color:C.textSecondary,textTransform:'uppercase',letterSpacing:'0.08em'}}>{label}</p>
      <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
        {chips.map(chip=>{const active=(filters[filterKey]||[]).includes(chip);return(
          <div key={chip} onClick={()=>toggleChip(filterKey,chip)} style={{padding:'4px 10px',borderRadius:'20px',border:'1px solid '+(active?C.primary:C.borderMedium),background:active?C.primary:C.white,color:active?C.white:C.textSecondary,fontFamily:F.body,fontSize:'11px',fontWeight:active?600:400,cursor:'pointer'}}>{chip}</div>
        );})}
      </div>
    </div>
  );
  return(
    <>
      {open&&<div onClick={onClose} style={{position:'fixed',inset:0,zIndex:299,background:'rgba(0,0,0,0.18)'}}/>}
      <div style={{position:'fixed',top:0,right:0,bottom:0,width:'272px',background:C.white,borderLeft:'1px solid '+C.border,boxShadow:'-8px 0 32px rgba(0,0,0,0.12)',zIndex:300,display:'flex',flexDirection:'column',transform:open?'translateX(0)':'translateX(100%)',transition:'transform 0.25s ease'}}>
        <div style={{height:'56px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',borderBottom:'1px solid '+C.border}}>
          <span style={{fontFamily:F.headline,fontSize:'15px',fontWeight:700,color:C.textPrimary}}>Filters</span>
          <div onClick={onClose} style={{width:'28px',height:'28px',borderRadius:'6px',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',background:C.neutral}}>
            <i className="ti ti-x" style={{fontSize:'13px',color:C.textSecondary}}/>
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'20px'}}>
          <ChipGroup label="Property Type" filterKey="propertyTypes" chips={PROPERTY_TYPES}/>
          <ChipGroup label="Occupancy Status" filterKey="occupancyStatus" chips={OCCUPANCY_STATUS}/>
          <ChipGroup label="Maintenance Priority" filterKey="maintPriority" chips={MAINT_PRIORITY}/>
          <div>
            <p style={{margin:'0 0 10px',fontFamily:F.body,fontSize:'10px',fontWeight:700,color:C.textSecondary,textTransform:'uppercase',letterSpacing:'0.08em'}}>Dashboard Modules</p>
            {MODULES.map(mod=>(
              <div key={mod} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid '+C.border}}>
                <span style={{fontFamily:F.body,fontSize:'12px',color:C.textPrimary}}>{mod}</span>
                <div onClick={()=>setModuleToggles(prev=>({...prev,[mod]:!prev[mod]}))} style={{width:'36px',height:'20px',borderRadius:'10px',background:moduleToggles[mod]?C.primary:C.borderMedium,position:'relative',cursor:'pointer',transition:'background 0.2s',flexShrink:0}}>
                  <div style={{position:'absolute',top:'2px',left:moduleToggles[mod]?'18px':'2px',width:'16px',height:'16px',borderRadius:'50%',background:C.white,boxShadow:'0 1px 3px rgba(0,0,0,0.2)',transition:'left 0.2s'}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{flexShrink:0,padding:'16px 20px',borderTop:'1px solid '+C.border,display:'flex',gap:'10px'}}>
          <Button variant="secondary" onClick={handleReset} style={{flex:1,height:'38px'}}>Reset</Button>
          <Button variant="primary" onClick={onClose} style={{flex:2,height:'38px'}}>Apply Filters</Button>
        </div>
      </div>
    </>
  );
}

const MOCK_REPORTS=[
  {id:1,name:'Revenue Summary',desc:'Total revenue collected vs expected across your portfolio',category:'Financial',lastRun:'May 27, 2026'},
  {id:2,name:'Rent Collection Report',desc:'Breakdown of rent received, pending, and overdue by property',category:'Financial',lastRun:'May 28, 2026'},
  {id:3,name:'Occupancy Report',desc:'Current occupancy rates and vacancy trends by unit type',category:'Operations',lastRun:'May 26, 2026'},
  {id:4,name:'P&L Statement',desc:'Profit and loss summary with expense breakdown MTD/YTD',category:'Financial',lastRun:'May 25, 2026'},
  {id:5,name:'Owner Statement',desc:'Owner-facing income and expense report per property',category:'Financial',lastRun:'May 20, 2026'},
  {id:6,name:'Maintenance Cost Report',desc:'Vendor invoices, work order costs, and spend trends',category:'Operations',lastRun:'May 22, 2026'},
  {id:7,name:'Lease Expiry Report',desc:'Leases expiring in 30, 60, and 90 days with renewal status',category:'Leasing',lastRun:'May 28, 2026'},
  {id:8,name:'Tax Export',desc:'Annual income and expense export formatted for tax filing',category:'Financial',lastRun:'Apr 15, 2026'},
  {id:9,name:'Custom Analytics',desc:'Build and save custom report views with your own filters',category:'Analytics',lastRun:'May 10, 2026'},
];
const REPORT_CAT_COLORS={Financial:{bg:'#EEF2FF',color:'#002D5B'},Operations:{bg:'#DCFCE7',color:'#166534'},Leasing:{bg:'#FEF3C7',color:'#92400E'},Analytics:{bg:'#F3E8FF',color:'#6B21A8'}};

function CustomReportsModal({open,onClose}){
  const [activeCategory,setActiveCategory]=useState('All');
  const categories=['All','Financial','Operations','Leasing','Analytics'];
  const filtered=activeCategory==='All'?MOCK_REPORTS:MOCK_REPORTS.filter(r=>r.category===activeCategory);
  if(!open)return null;
  return(
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:399,background:'rgba(0,0,0,0.35)'}}/>
      <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%, -50%)',width:'clamp(480px, 50vw, 720px)',maxHeight:'80vh',background:C.white,borderRadius:'16px',border:'1px solid '+C.border,boxShadow:'0 24px 64px rgba(0,0,0,0.18)',zIndex:400,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'18px 22px 14px',borderBottom:'1px solid '+C.border,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'12px'}}>
            <div>
              <h2 style={{margin:'0 0 3px',fontFamily:F.headline,fontSize:'clamp(16px,1.6vw,20px)',fontWeight:700,color:C.textPrimary}}>Custom Reports</h2>
              <p style={{margin:0,fontFamily:F.body,fontSize:'13px',color:C.textSecondary}}>Select a report to view or download. Access is based on your role.</p>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'6px',flexShrink:0}}>
              {[{icon:'ti-download',title:'Download'},{icon:'ti-printer',title:'Print'}].map(btn=>(
                <div key={btn.icon} title={btn.title} style={{width:'32px',height:'32px',borderRadius:'7px',border:'1px solid '+C.borderMedium,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.background=C.pageBg} onMouseLeave={e=>e.currentTarget.style.background=C.white}>
                  <i className={`ti ${btn.icon}`} style={{fontSize:'15px',color:C.textSecondary}}/>
                </div>
              ))}
              <div onClick={onClose} style={{width:'32px',height:'32px',borderRadius:'7px',background:C.pageBg,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer'}}>
                <i className="ti ti-x" style={{fontSize:'14px',color:C.textSecondary}}/>
              </div>
            </div>
          </div>
          <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
            {categories.map(cat=>{const isActive=activeCategory===cat;return(
              <div key={cat} onClick={()=>setActiveCategory(cat)} style={{padding:'4px 12px',borderRadius:'20px',border:'1px solid '+(isActive?C.primary:C.borderMedium),background:isActive?C.primary:C.white,color:isActive?C.white:C.textSecondary,fontFamily:F.body,fontSize:'11px',fontWeight:isActive?700:400,cursor:'pointer'}}>{cat}</div>
            );})}
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'10px 22px 16px'}}>
          {filtered.map((report,idx)=>{const catStyle=REPORT_CAT_COLORS[report.category]||{bg:C.pageBg,color:C.textSecondary};return(
            <div key={report.id} style={{display:'flex',alignItems:'center',gap:'14px',padding:'12px 0',borderBottom:idx<filtered.length-1?'1px solid '+C.border:'none'}}>
              <div style={{width:'36px',height:'36px',borderRadius:'8px',background:catStyle.bg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <i className="ti ti-file-analytics" style={{fontSize:'17px',color:catStyle.color}}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'3px'}}>
                  <span style={{fontFamily:F.body,fontSize:'13px',fontWeight:600,color:C.textPrimary}}>{report.name}</span>
                  <span style={{background:catStyle.bg,color:catStyle.color,fontFamily:F.body,fontSize:'9px',fontWeight:700,borderRadius:'4px',padding:'2px 6px',letterSpacing:'0.04em'}}>{report.category.toUpperCase()}</span>
                </div>
                <p style={{margin:'0 0 2px',fontFamily:F.body,fontSize:'11px',color:C.textSecondary}}>{report.desc}</p>
                <span style={{fontFamily:F.body,fontSize:'10px',color:C.textTertiary}}>Last run: {report.lastRun}</span>
              </div>
              <div style={{display:'flex',gap:'6px',flexShrink:0}}>
                <button style={{height:'30px',padding:'0 12px',background:C.white,border:'1px solid '+C.borderMedium,borderRadius:'6px',fontFamily:F.body,fontSize:'11px',fontWeight:600,color:C.textSecondary,cursor:'pointer'}} onMouseEnter={e=>{e.currentTarget.style.background=C.pageBg;e.currentTarget.style.color=C.primary;e.currentTarget.style.borderColor=C.primary}} onMouseLeave={e=>{e.currentTarget.style.background=C.white;e.currentTarget.style.color=C.textSecondary;e.currentTarget.style.borderColor=C.borderMedium}}>
                  <i className="ti ti-download" style={{fontSize:'11px',marginRight:'4px'}}/>Export
                </button>
                <button style={{height:'30px',padding:'0 12px',background:C.primary,border:'none',borderRadius:'6px',fontFamily:F.body,fontSize:'11px',fontWeight:700,color:C.white,cursor:'pointer'}} onMouseEnter={e=>e.currentTarget.style.background=C.primaryHover} onMouseLeave={e=>e.currentTarget.style.background=C.primary}>Run</button>
              </div>
            </div>
          );})}
        </div>
        <div style={{flexShrink:0,padding:'12px 22px',borderTop:'1px solid '+C.border,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontFamily:F.body,fontSize:'11px',color:C.textTertiary}}>Showing {filtered.length} of {MOCK_REPORTS.length} reports</span>
          <button onClick={onClose} style={{height:'32px',padding:'0 16px',background:C.white,border:'1px solid '+C.borderMedium,borderRadius:'7px',fontFamily:F.body,fontSize:'12px',fontWeight:600,color:C.textSecondary,cursor:'pointer'}}>Close</button>
        </div>
      </div>
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PMDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const isSampleMode = new URLSearchParams(location.search).get('mode') === 'sample';

  const [userName,      setUserName]      = useState('');
  const [userRole,      setUserRole]      = useState('Independent PM');
  const [activeDate,    setActiveDate]    = useState('Today');
  const [selectedCity,  setSelectedCity]  = useState('');
  const [selectedProp,  setSelectedProp]  = useState('');
  const [filterOpen,    setFilterOpen]    = useState(false);
  const [reportsOpen,   setReportsOpen]   = useState(false);
  const [propPanelOpen, setPropPanelOpen] = useState(true);
  const [filters,       setFilters]       = useState({ propertyTypes:[], occupancyStatus:[], maintPriority:[] });
  const [moduleToggles, setModuleToggles] = useState({
    'Leasing Activity':true,'Property Snapshot':true,'Financial Pulse':true,
    'Recent Activity':true,'Recent Transactions':true,
  });

  const CITY_OPTIONS = [
    {value:'',label:'All Cities'},{value:'austin',label:'Austin'},
    {value:'dallas',label:'Dallas'},{value:'houston',label:'Houston'},
  ];
  const PROPERTY_OPTIONS = [
    {value:'',label:'All Properties'},
    ...MOCK_PROPERTIES.map(p=>({value:p.id,label:p.name})),
  ];
  const filteredProperties = MOCK_PROPERTIES.filter(p => {
    if (selectedProp && p.id !== selectedProp) return false;
    if (selectedCity && p.city !== selectedCity) return false;
    return true;
  });
  const cityLabel = CITY_OPTIONS.find(o=>o.value===selectedCity)?.label||'All Cities';
  const propLabel = selectedProp ? MOCK_PROPERTIES.find(p=>p.id===selectedProp)?.name : 'All Properties';
  const contextText = `${cityLabel} · ${propLabel} · ${filteredProperties.reduce((s,p)=>s+p.units,0)} units`;

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { navigate('/login'); return; }
    fetch('http://localhost:8001/api/auth/me/', { headers:{ Authorization:'Bearer '+token } })
      .then(r=>r.ok?r.json():null)
      .then(data=>{
        if (data) {
          setUserName(((data.first_name||'')+' '+(data.last_name||'')).trim()||data.email||'User');
          setUserRole(data.role||data.active_persona||'Independent PM');
        } else {
          const d=decodeJWT(token);
          if(d)setUserName(((d.first_name||'')+' '+(d.last_name||'')).trim()||d.email||'User');
        }
      })
      .catch(()=>{
        const d=decodeJWT(localStorage.getItem('access_token'));
        if(d)setUserName(d.email||'User');
      });
  }, [navigate]);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { height: 100%; overflow: hidden; margin: 0; padding: 0; }
        @keyframes fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        .dash-scroll::-webkit-scrollbar { width: 5px; }
        .dash-scroll::-webkit-scrollbar-track { background: transparent; }
        .dash-scroll::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
        .prop-scroll::-webkit-scrollbar { width: 4px; }
        .prop-scroll::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
      `}</style>

      <div style={{display:'flex',height:'100vh',overflow:'hidden',background:C.pageBg,fontFamily:F.body}}>
        <NavB activeId="my-dashboard" />

        <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0,overflow:'hidden'}}>
          <Header userName={userName} userRole={userRole} />

          <div style={{flex:1,display:'flex',minHeight:0,overflow:'hidden'}}>
            <div className="dash-scroll" style={{flex:1,overflowY:'auto',padding:'clamp(16px,2vw,24px) clamp(20px,3vw,36px) 32px',minWidth:0}}>

              {/* ── Sample banner — shown when ?mode=sample ── */}
              {isSampleMode && (
                <SampleBanner onBack={() => navigate('/pm-portal/dashboard/welcome')} />
              )}

              {/* Page title */}
              <div style={{marginBottom:'16px',animation:'fadein 0.3s ease both'}}>
                <h1 style={{margin:'0 0 4px',fontFamily:F.headline,fontSize:'clamp(22px,2.2vw,28px)',fontWeight:700,color:C.textPrimary}}>My Dashboard</h1>
                <p style={{margin:0,fontFamily:F.headline,fontSize:'clamp(13px,1.2vw,15px)',fontWeight:600,color:C.green}}>Portfolio Overview</p>
              </div>

              {/* Control bar */}
              <div style={{background:C.white,border:'1px solid '+C.border,borderRadius:'12px',marginBottom:'16px',overflow:'hidden',animation:'fadein 0.3s ease 0.05s both'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',padding:'clamp(10px,1.5vw,14px) clamp(14px,2vw,18px) 10px',flexWrap:'wrap'}}>
                  <span style={{fontFamily:F.body,fontSize:'10px',fontWeight:700,color:C.textTertiary,textTransform:'uppercase',letterSpacing:'0.08em'}}>Viewing</span>
                  <div style={{display:'flex',alignItems:'center',gap:'5px',padding:'4px 10px',background:C.contextBg,border:'1.5px dashed '+C.contextBorder,borderRadius:'20px'}}>
                    <i className="ti ti-lock" style={{fontSize:'10px',color:C.primary}}/>
                    <span style={{fontFamily:F.body,fontSize:'12px',fontWeight:600,color:C.primary}}>My Portfolio</span>
                  </div>
                  <i className="ti ti-chevron-right" style={{fontSize:'11px',color:C.textTertiary}}/>
                  <MiniSelector options={CITY_OPTIONS} value={selectedCity} onChange={v=>{setSelectedCity(v);setSelectedProp('');}}/>
                  <i className="ti ti-chevron-right" style={{fontSize:'11px',color:C.textTertiary}}/>
                  <MiniSelector options={PROPERTY_OPTIONS} value={selectedProp} onChange={setSelectedProp}/>
                  <div style={{flex:1}}/>
                  <div onClick={()=>setPropPanelOpen(p=>!p)} style={{display:'flex',alignItems:'center',gap:'5px',padding:'5px 9px',background:propPanelOpen?C.contextBg:C.neutral,border:'1px solid '+(propPanelOpen?C.primary:C.borderMedium),borderRadius:'7px',cursor:'pointer',flexShrink:0}} onMouseEnter={e=>{if(!propPanelOpen){e.currentTarget.style.background='#F0F5FF';e.currentTarget.style.borderColor=C.contextBorder}}} onMouseLeave={e=>{if(!propPanelOpen){e.currentTarget.style.background=C.neutral;e.currentTarget.style.borderColor=C.borderMedium}}}>
                    <i className="ti ti-layout-sidebar-right" style={{fontSize:'14px',color:propPanelOpen?C.primary:C.textTertiary}}/>
                    <span style={{background:propPanelOpen?C.primary:C.borderMedium,color:propPanelOpen?C.white:C.textSecondary,fontFamily:F.body,fontSize:'9px',fontWeight:700,borderRadius:'99px',padding:'1px 5px',minWidth:'16px',textAlign:'center'}}>{filteredProperties.length}</span>
                  </div>
                  <div onClick={()=>setReportsOpen(true)} title="Custom Reports" style={{width:'32px',height:'32px',borderRadius:'7px',border:'1px solid '+C.borderMedium,background:C.white,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}} onMouseEnter={e=>{e.currentTarget.style.background=C.contextBg;e.currentTarget.style.borderColor=C.contextBorder}} onMouseLeave={e=>{e.currentTarget.style.background=C.white;e.currentTarget.style.borderColor=C.borderMedium}}>
                    <i className="ti ti-file-analytics" style={{fontSize:'15px',color:C.textSecondary}}/>
                  </div>
                </div>
                <div style={{display:'flex',padding:'0 clamp(14px,2vw,18px)',borderTop:'1px solid '+C.border}}>
                  {DATE_TABS.map(tab=>{const isActive=activeDate===tab;return(
                    <button key={tab} onClick={()=>setActiveDate(tab)} style={{padding:'8px clamp(8px,1.2vw,14px)',background:'none',border:'none',borderBottom:isActive?`2px solid ${C.primary}`:'2px solid transparent',fontFamily:F.body,fontSize:'12px',fontWeight:isActive?700:400,color:isActive?C.primary:C.textTertiary,cursor:'pointer',transition:'all 0.12s',marginBottom:'-1px'}}>{tab}</button>
                  );})}
                </div>
              </div>

              {/* Context badge */}
              <div style={{display:'inline-flex',alignItems:'center',gap:'5px',background:C.contextBg,border:'1px solid '+C.contextBorder,borderRadius:'20px',padding:'4px 12px',marginBottom:'14px',animation:'fadein 0.3s ease 0.08s both'}}>
                <i className="ti ti-map-pin" style={{fontSize:'11px',color:C.primary}}/>
                <span style={{fontFamily:F.body,fontSize:'11px',fontWeight:600,color:C.primary}}>{contextText}</span>
              </div>

              {/* Metric cards */}
              <div style={{display:'flex',gap:'clamp(8px,1.2vw,12px)',marginBottom:'clamp(10px,1.5vw,14px)',animation:'fadein 0.3s ease 0.1s both'}}>
                <MetricCard icon="ti-building"   accentColor={C.primary} label="Total Units"      value={MOCK_METRICS.totalUnits}                       sub={`Across ${MOCK_METRICS.totalProperties} properties`}/>
                <MetricCard icon="ti-home-check" accentColor={C.green}   label="Occupancy Rate"   value={`${MOCK_METRICS.occupancyRate}%`}              sub="vs last month" trend={MOCK_METRICS.occupancyTrend}/>
                <MetricCard icon="ti-cash"       accentColor={C.amber}   label="Revenue MTD"      value={`$${MOCK_METRICS.revenueMTD.toLocaleString()}`} sub={`${MOCK_METRICS.collectionRate}% collected`}/>
                <MetricCard icon="ti-tool"       accentColor={C.danger}  label="Open Maintenance" value={MOCK_METRICS.openMaintenance}                   sub={`${MOCK_METRICS.overdueCount} overdue`} subDanger/>
              </div>

              {/* Row 1 */}
              <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,0.75fr) minmax(0,1fr)',gap:'clamp(8px,1.2vw,12px)',marginBottom:'clamp(8px,1.2vw,12px)',animation:'fadein 0.3s ease 0.14s both'}}>
                {moduleToggles['Leasing Activity']  && <LeasingActivityCard/>}
                {moduleToggles['Property Snapshot'] && <PropertySnapshotCard/>}
                {moduleToggles['Financial Pulse']   && <FinancialPulseCard/>}
              </div>

              {/* Row 2 */}
              <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)',gap:'clamp(8px,1.2vw,12px)',animation:'fadein 0.3s ease 0.18s both'}}>
                {moduleToggles['Recent Activity']     && <RecentActivityCard/>}
                {moduleToggles['Recent Transactions'] && <RecentTransactionsCard/>}
              </div>

              <p style={{textAlign:'center',fontFamily:F.body,fontSize:'10px',color:C.textTertiary,margin:'28px 0 0',letterSpacing:'0.04em'}}>
                © 2024 URBANNEST EDITORIAL SYSTEMS. ALL RIGHTS RESERVED.
              </p>
            </div>

            {propPanelOpen && (
              <PropertyPanel properties={filteredProperties} onClose={()=>setPropPanelOpen(false)}/>
            )}
          </div>
        </div>
      </div>

      <CustomReportsModal open={reportsOpen} onClose={()=>setReportsOpen(false)}/>
      <FilterPanel open={filterOpen} onClose={()=>setFilterOpen(false)} filters={filters} setFilters={setFilters} moduleToggles={moduleToggles} setModuleToggles={setModuleToggles}/>
    </>
  );
}
