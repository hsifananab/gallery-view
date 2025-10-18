import { DEFAULT_PALETTE } from "../types";

export const GALLERY_CSS = `
  .gallery-filter{
    margin-bottom:12px;
  }
  .tag-cloud{
    margin-bottom:12px;
    display:flex;
    flex-wrap:wrap;
    align-items:center;
    gap:4px;
  }
  .tag-cloud__tags{
    display:flex;
    flex-wrap:wrap;
    align-items:center;
    gap:4px;
    min-width:0;
    padding-right:0;
  }
  .status-control{
    display:inline-flex;
    align-items:center;
    margin:1px 3px;
    border:1px solid ${DEFAULT_PALETTE.surface2};
    border-radius:18px;
    padding:2px;
    background:rgba(49,50,68,0.45);
    box-shadow:0 0 0 1px rgba(0,0,0,0.25);
    gap:2px;
  }
  .status-segment{
    display:flex;
    align-items:center;
    justify-content:center;
    width:28px;
    height:24px;
    border:none;
    border-radius:14px;
    background:transparent;
    color:${DEFAULT_PALETTE.subtext};
    font-size:13px;
    font-weight:600;
    cursor:pointer;
    transition:background .18s,color .18s,box-shadow .2s;
  }
  .status-segment:hover{
    background:rgba(137,180,250,0.15);
    color:${DEFAULT_PALETTE.text};
  }
  .status-segment.is-active{
    background:rgba(137,180,250,0.25);
    color:${DEFAULT_PALETTE.text};
    box-shadow:0 0 0 1px rgba(137,180,250,0.4);
  }
  .status-segment:focus-visible{
    outline:2px solid ${DEFAULT_PALETTE.accent};
    outline-offset:1px;
  }
  .film-grid{
    position:relative;
    display:grid;
    grid-template-columns: repeat(var(--card-columns, auto-fit), minmax(var(--card-width, 120px), 1fr));
    gap:6px;
    justify-content:start;
    align-items:start;
    line-height:0;
    margin-top:12px;
  }
  .film-grid a{
    position:relative;
    display:block;
    width:100%;
    height:var(--card-height, 180px);
    border-radius:var(--card-radius, 6px);
    perspective:720px;
    transform-style:preserve-3d;
  }
  .card-tilt{
    position:relative;
    width:100%;
    height:100%;
    border-radius:inherit;
    overflow:hidden;
    background:rgba(0,0,0,0.12);
    --rx: 0deg;
    --ry: 0deg;
    transform:rotateX(var(--rx)) rotateY(var(--ry));
    transition:transform .18s ease, box-shadow .2s ease, filter .2s ease;
    box-shadow:0 8px 26px rgba(0,0,0,0.25);
    will-change:transform;
  }
  .film-grid a:hover .card-tilt{
    box-shadow:0 14px 36px rgba(0,0,0,0.35);
  }
  .card-tilt img{
    width:100%;
    height:100%;
    object-fit:cover;
    display:block;
    transition: transform .30s cubic-bezier(.16,1,.3,1);
  }
  .film-grid a:hover .card-tilt img{ transform: scale(1.05); }
  .tag-cloud.is-hovering .tag-chip:not(.active):not(:hover){
    filter: blur(.6px) brightness(.85); opacity:.7;
  }
  .tag-chip{
    margin:1px 3px; padding:2px 7px; border-radius:4px;
    border:1px solid ${DEFAULT_PALETTE.surface2};
    background:transparent;
    color:${DEFAULT_PALETTE.subtext};
    font-size:0.8em; font-weight:400;
    cursor:pointer; transition:background .15s,border-color .15s,color .15s,filter .2s,opacity .2s;
  }
  .tag-chip.active{
    border-color:${DEFAULT_PALETTE.accent};
    background:rgba(137,180,250,0.15);
    color:${DEFAULT_PALETTE.text};
    font-weight:500;
  }
`;
