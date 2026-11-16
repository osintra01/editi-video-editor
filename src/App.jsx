import { useEffect, useRef, useState } from 'react';
import {
  AudioLines, Captions, Check, ChevronDown, CircleHelp, Clapperboard, Crop,
  Download, Film, FolderOpen, Gauge, Image, Layers3, Menu, MoreHorizontal,
  Music2, Pause, Play, Plus, Scissors, Settings2, Sparkles, Type, Upload,
  Volume2, WandSparkles, X,
} from 'lucide-react';

const formatTime = (seconds = 0) => {
  if (!Number.isFinite(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

export default function App() {
  const [assets, setAssets] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [title, setTitle] = useState('Mon premier montage');
  const [overlay, setOverlay] = useState('');
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTool, setActiveTool] = useState('Médias');
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const inputRef = useRef(null);
  const rafRef = useRef(null);
  const chosen = assets.find((asset) => asset.id === selectedId && asset.kind === 'video');

  useEffect(() => () => assets.forEach((asset) => URL.revokeObjectURL(asset.url)), []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !chosen) return;
    video.src = chosen.url;
    video.load();
    setCurrentTime(0);
    setTrimStart(0);
    setTrimEnd(0);
    setPlaying(false);
  }, [selectedId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const update = () => setCurrentTime(video.currentTime || 0);
    const ended = () => setPlaying(false);
    video.addEventListener('timeupdate', update);
    video.addEventListener('ended', ended);
    return () => {
      video.removeEventListener('timeupdate', update);
      video.removeEventListener('ended', ended);
    };
  }, [chosen?.id]);

  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(''), 3500);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  const importFiles = (fileList) => {
    const added = Array.from(fileList || []).map((file) => {
      const kind = file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : file.type.startsWith('image/') ? 'image' : null;
      if (!kind) return null;
      return { id: crypto.randomUUID(), file, kind, url: URL.createObjectURL(file), name: file.name, duration: 0 };
    }).filter(Boolean);
    if (!added.length) { setNotice('Choisis un fichier vidéo, audio ou image.'); return; }
    setAssets((prev) => [...prev, ...added]);
    const firstVideo = added.find((item) => item.kind === 'video');
    if (firstVideo) setSelectedId(firstVideo.id);
    setNotice(`${added.length} média${added.length > 1 ? 's' : ''} importé${added.length > 1 ? 's' : ''} sur cet appareil.`);
  };

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video || !chosen) return;
    if (playing) { video.pause(); setPlaying(false); return; }
    const duration = video.duration || 0;
    if (trimEnd > trimStart && (video.currentTime < trimStart || video.currentTime >= trimEnd)) video.currentTime = trimStart;
    try { await video.play(); setPlaying(true); } catch { setNotice('Impossible de lire ce format dans ce navigateur.'); }
    if (duration) setTrimEnd((prev) => prev || duration);
  };

  const markIn = () => { setTrimStart(currentTime); setNotice(`Début défini à ${formatTime(currentTime)}.`); };
  const markOut = () => { setTrimEnd(currentTime); setNotice(`Fin définie à ${formatTime(currentTime)}.`); };

  const exportClip = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !chosen || !canvas) { setNotice('Importe et sélectionne d’abord une vidéo.'); return; }
    if (!window.MediaRecorder || !canvas.captureStream) { setNotice('L’export WebM n’est pas pris en charge par ce navigateur.'); return; }
    const duration = video.duration || 0;
    const start = Math.max(0, Math.min(trimStart, duration));
    const end = Math.min(trimEnd || duration, duration);
    if (end <= start) { setNotice('La durée de sélection doit être supérieure à zéro.'); return; }
    setExporting(true);
    setPlaying(false);
    video.pause();
    const ctx = canvas.getContext('2d');
    const width = Math.min(1920, video.videoWidth || 1280);
    const height = Math.round(width * ((video.videoHeight || 720) / (video.videoWidth || 1280)));
    canvas.width = width;
    canvas.height = height;
    const stream = canvas.captureStream(30);
    const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((type) => MediaRecorder.isTypeSupported(type)) || '';
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks = [];
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    recorder.onerror = () => { setExporting(false); setNotice('Une erreur est survenue pendant l’export.'); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${title.trim().replace(/[^a-z0-9-_ ]/gi, '').replace(/\s+/g, '-') || 'editi-video'}.webm`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 5000);
      stream.getTracks().forEach((track) => track.stop());
      setExporting(false);
      setNotice('Export terminé : vidéo WebM enregistrée sans filigrane.');
    };
    const draw = () => {
      ctx.fillStyle = '#090a0d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (video.readyState >= 2) {
        const scale = Math.min(canvas.width / video.videoWidth, canvas.height / video.videoHeight);
        const w = video.videoWidth * scale;
        const h = video.videoHeight * scale;
        ctx.drawImage(video, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      }
      if (overlay.trim()) {
        ctx.font = `bold ${Math.max(28, Math.round(width * 0.045))}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.lineWidth = Math.max(3, width / 320);
        ctx.strokeStyle = 'rgba(0,0,0,.8)';
        ctx.fillStyle = '#fff';
        const y = height - Math.max(32, height * 0.08);
        ctx.strokeText(overlay, width / 2, y, width * 0.9);
        ctx.fillText(overlay, width / 2, y, width * 0.9);
      }
      if (!recorder || recorder.state === 'recording') rafRef.current = requestAnimationFrame(draw);
    };
    const finish = () => { if (recorder.state === 'recording') recorder.stop(); cancelAnimationFrame(rafRef.current); };
    recorder.start(250);
    video.currentTime = start;
    video.onended = finish;
    video.ontimeupdate = () => { if (video.currentTime >= end) { video.pause(); finish(); } };
    video.onseeked = async () => {
      try { await video.play(); draw(); } catch { finish(); }
    };
    video.onerror = finish;
  };

  const tools = [
    { name: 'Médias', icon: FolderOpen }, { name: 'Audio', icon: Music2 },
    { name: 'Texte', icon: Type }, { name: 'Sous-titres', icon: Captions },
    { name: 'Filtres', icon: Sparkles }, { name: 'Ajuster', icon: Settings2 },
    { name: 'Recadrer', icon: Crop }, { name: 'Vitesse', icon: Gauge },
  ];
  const visualAssets = assets.filter((asset) => asset.kind !== 'audio');
  const duration = chosen ? (videoRef.current?.duration || 0) : 0;
  const timelineWidth = Math.max(100, duration * 48);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark"><Clapperboard size={19} /></div><span>editi</span><span className="brand-studio">STUDIO</span></div>
        <button className="project-name" onClick={() => { const value = window.prompt('Nom du projet', title); if (value?.trim()) setTitle(value.trim()); }} title="Renommer le projet">{title}<ChevronDown size={14} /></button>
        <div className="top-actions"><span className="saved"><Check size={14} /> Enregistré localement</span><button className="help-button" title="Aide"><CircleHelp size={18} /></button><button className="export-button" onClick={exportClip} disabled={exporting}>{exporting ? <span className="spinner" /> : <Download size={16} />}{exporting ? 'Export…' : 'Exporter'}</button><button className="mobile-menu" onClick={() => setMobileMenu(!mobileMenu)}><Menu /></button></div>
      </header>
      <div className="workspace">
        <aside className={`tool-rail ${mobileMenu ? 'open' : ''}`}>
          {tools.map(({ name, icon: Icon }) => <button key={name} className={`tool-button ${activeTool === name ? 'active' : ''}`} onClick={() => { setActiveTool(name); setMobileMenu(false); }}><Icon size={19} /><span>{name}</span></button>)}
          <div className="rail-bottom"><button className="tool-button" onClick={() => setNotice('Editi traite les médias localement sur votre appareil.')}><CircleHelp size={19} /><span>Aide</span></button></div>
        </aside>
        <section className="asset-panel">
          <div className="panel-heading"><div><span className="eyebrow">ESPACE DE TRAVAIL</span><h2>{activeTool}</h2></div><button className="icon-button" onClick={() => inputRef.current?.click()} title="Importer"><Plus size={18} /></button></div>
          {activeTool === 'Médias' || activeTool === 'Audio' ? <>
            <button className="import-card" onClick={() => inputRef.current?.click()}><Upload size={20} /><strong>Importer des médias</strong><span>Vidéo, audio et images · local uniquement</span></button>
            <input ref={inputRef} className="hidden" type="file" multiple accept="video/*,audio/*,image/*" onChange={(event) => { importFiles(event.target.files); event.target.value = ''; }} />
            <div className="asset-list">{assets.filter((asset) => activeTool !== 'Audio' || asset.kind === 'audio').map((asset) => <button key={asset.id} className={`asset-item ${selectedId === asset.id ? 'selected' : ''}`} onClick={() => asset.kind === 'video' ? setSelectedId(asset.id) : setNotice(asset.kind === 'audio' ? 'Piste audio importée. Le mixage audio sera ajouté dans une prochaine version.' : 'Image importée dans les médias.')}>
              <div className="asset-thumb">{asset.kind === 'video' ? <Film size={18} /> : asset.kind === 'audio' ? <AudioLines size={18} /> : <Image size={18} />}</div><span className="asset-label"><strong>{asset.name}</strong><small>{asset.kind === 'video' ? 'Vidéo' : asset.kind === 'audio' ? 'Audio' : 'Image'}</small></span><MoreHorizontal size={17} />
            </button>)}</div>
            {!assets.length && <div className="empty-hint"><Film size={22} /><span>Vos médias importés apparaîtront ici.</span></div>}
          </> : activeTool === 'Texte' ? <div className="tool-content"><label htmlFor="overlay">Texte à afficher sur la vidéo</label><textarea id="overlay" value={overlay} onChange={(event) => setOverlay(event.target.value)} placeholder="Écris ton titre…" maxLength={100} /><span className="muted small">Le texte sera visible pendant toute la durée de l’export.</span></div> : <div className="coming-soon"><div className="coming-icon"><WandSparkles size={22} /></div><strong>{activeTool} arrive bientôt</strong><p>Cette fonction est prévue pour une prochaine version d’Editi. Le projet est gratuit et open source.</p></div>}
          <div className="panel-foot"><Layers3 size={15} /><span>{assets.length} média{assets.length > 1 ? 's' : ''} dans ce projet</span></div>
        </section>
        <section className="editor-area">
          <div className="preview-toolbar"><span>Aperçu</span><div className="preview-controls"><span className="resolution-tag">ORIGINAL</span><button className="icon-button" title="Plus d’options"><MoreHorizontal size={18} /></button></div></div>
          <div className="preview-stage">
            {chosen ? <div className="video-wrap"><video ref={videoRef} className="preview-video" playsInline onClick={togglePlayback} onLoadedMetadata={(event) => { setTrimEnd((prev) => prev || event.currentTarget.duration); }} /><div className="video-title">{overlay}</div>{!playing && <button className="big-play" onClick={togglePlayback}><Play size={24} fill="currentColor" /></button>}</div> : <div className="preview-empty"><div className="preview-empty-icon"><Clapperboard size={28} /></div><strong>Ton prochain montage commence ici</strong><span>Importe une vidéo pour la placer sur la timeline.</span><button className="secondary-button" onClick={() => inputRef.current?.click()}><Upload size={15} />Importer des médias</button></div>}
          </div>
          <div className="playback-bar"><div className="timecode"><span className="time-current">{formatTime(currentTime)}</span><span className="time-divider">/</span><span>{formatTime(duration)}</span></div><div className="transport"><button className="transport-button" onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, currentTime - 5); }}>«</button><button className="play-button" onClick={togglePlayback} disabled={!chosen}>{playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</button><button className="transport-button" onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.min(duration, currentTime + 5); }}>»</button></div><button className="icon-button volume-button" title="Volume"><Volume2 size={17} /></button></div>
          <div className="timeline-section">
            <div className="timeline-header"><div className="timeline-title"><span>Timeline</span><span className="muted">{visualAssets.length} clip{visualAssets.length === 1 ? '' : 's'}</span></div><div className="timeline-tools"><button className="tiny-button" onClick={markIn} disabled={!chosen}><Scissors size={14} />Début</button><button className="tiny-button" onClick={markOut} disabled={!chosen}><Scissors size={14} />Fin</button><button className="icon-button" onClick={() => inputRef.current?.click()} title="Ajouter un média"><Plus size={17} /></button></div></div>
            <div className="timeline-scroll"><div className="timeline-ruler" style={{ width: `${Math.max(100, timelineWidth)}px` }}>{Array.from({ length: Math.max(5, Math.ceil(duration / 5) + 1) }, (_, index) => <span key={index} style={{ left: `${index * 5 * 48}px` }}>{formatTime(index * 5)}</span>)}</div>
              {chosen ? <div className="track-row"><div className="track-name"><Film size={15} /><span>Vidéo 1</span></div><div className="clip-track" style={{ width: `${timelineWidth}px` }}><button className="clip-block" style={{ width: `${Math.max(160, duration * 48)}px` }} onClick={() => videoRef.current && (videoRef.current.currentTime = currentTime)}><div className="clip-wave"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div><span className="clip-name">{chosen.name}</span></button><div className="playhead" style={{ left: `${Math.max(0, currentTime * 48)}px` }} /></div></div> : <div className="timeline-empty"><span>Importe une vidéo pour commencer le montage</span></div>}
              {assets.some((asset) => asset.kind === 'audio') && <div className="track-row audio-row"><div className="track-name"><Music2 size={15} /><span>Audio</span></div><div className="audio-placeholder">Piste audio importée — mixage à venir</div></div>}
            </div>
            <div className="trim-controls"><span>Zone de montage</span><label>Début <input type="number" min="0" step="0.1" value={trimStart} onChange={(event) => setTrimStart(Number(event.target.value))} disabled={!chosen} /> s</label><label>Fin <input type="number" min="0" step="0.1" value={trimEnd ? trimEnd.toFixed(1) : ''} onChange={(event) => setTrimEnd(Number(event.target.value))} disabled={!chosen} /> s</label></div>
          </div>
        </section>
      </div>
      <canvas ref={canvasRef} className="export-canvas" />
      {notice && <div className="toast"><Check size={16} />{notice}<button onClick={() => setNotice('')}><X size={15} /></button></div>}
      {exporting && <div className="export-status"><span className="spinner" />Export en cours, garde Editi ouvert…</div>}
      <footer className="statusbar"><span><span className="status-dot" />Tous les médias restent sur ton appareil</span><span>Editi Studio · Version prototype</span></footer>
    </main>
  );
}
