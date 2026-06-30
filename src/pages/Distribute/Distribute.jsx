import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaCopy, FaCheck, FaSave, FaSpinner, FaCode, FaSlidersH, FaEye, FaArrowsAlt } from 'react-icons/fa';
import { saveWidgetConfig, getWidgetConfig, generateToken, DEFAULT_WIDGET_CONFIG } from '../../services/widgetConfigService';
import './Distribute.css';

const Distribute = () => {
    // Use a fixed demo project ID for now — in production this comes from route params or context
    const projectId = 'demo';
    const token = generateToken(projectId);

    // Widget configuration state
    const [config, setConfig] = useState({ ...DEFAULT_WIDGET_CONFIG });
    const [configExists, setConfigExists] = useState(false);

    // UI states
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState(null);

    // Preview ref for re-rendering widget
    const previewRef = useRef(null);
    const previewTimeoutRef = useRef(null);

    // Load existing config on mount
    useEffect(() => {
        const loadConfig = async () => {
            setLoading(true);
            try {
                const { config: savedConfig, exists } = await getWidgetConfig(token);
                setConfig(savedConfig);
                setConfigExists(exists);
            } catch (err) {
                console.warn('Could not load config, using defaults:', err);
            } finally {
                setLoading(false);
            }
        };
        loadConfig();
    }, [token]);

    // Update a single config field
    const updateConfig = (field, value) => {
        setConfig(prev => ({ ...prev, [field]: value }));
        setSaveSuccess(false);
    };

    // Save config to Firestore
    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await saveWidgetConfig(token, config, projectId);
            setSaveSuccess(true);
            setConfigExists(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Copy embed snippet
    const embedCode = `<script src="https://prooflayer.io/pixel.js" data-token="${token}"></script>`;

    const handleCopy = () => {
        navigator.clipboard.writeText(embedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const openExternalPreview = () => {
        const popup = window.open('/demo/index.html?nocache=1', '_blank', 'width=1280,height=800');
        window.externalPreviewRef = popup;
        
        // After the window loads, send the initial config
        if (popup) {
            popup.onload = () => {
                popup.postMessage({
                    type: 'PROOFLAYER_CONFIG_UPDATE',
                    config: config,
                    previewData: [] // use whatever data is loaded
                }, '*');
            };
        }
    };

    // Send config updates to the live preview iframe
    useEffect(() => {
        if (loading) return;
        
        const sendConfigUpdate = () => {
            if (previewRef.current && previewRef.current.contentWindow) {
                // Build mock reviews for preview
                const mockReviews = [
                    { id: 'p1', author: 'James Wilson', role: 'Project Manager', content: 'Absolutely incredible product. The integration was seamless and the support team is fantastic.', rating: 5, source: 'G2', date: '2 days ago' },
                    { id: 'p2', author: 'Sarah Chen', role: 'Senior Developer', content: 'The profiler tools have helped us optimize performance significantly. A must-have for any team.', rating: 4.5, source: 'Capterra', date: '1 week ago' },
                    { id: 'p3', author: 'Michael Brown', role: 'CTO at TechFlow', content: 'We switched over and never looked back. The feature set is unmatched in the industry.', rating: 5, source: 'TrustRadius', date: '3 days ago' },
                    { id: 'p4', author: 'Emily Davis', role: 'Mobile App Lead', content: 'The support for modern frameworks is phenomenal. Highly recommended for UI development.', rating: 5, source: 'G2', date: '5 days ago' },
                    { id: 'p5', author: 'Alex Rodriguez', role: 'Engineering Manager', content: 'Streamlined our entire workflow. The analytics dashboard alone is worth the subscription.', rating: 4, source: 'Capterra', date: '1 day ago' },
                    { id: 'p6', author: 'Lisa Park', role: 'Product Designer', content: 'Beautiful design system integration. Our team productivity increased by 40% since adopting it.', rating: 5, source: 'G2', date: '4 days ago' },
                    { id: 'p7', author: 'David Kim', role: 'VP of Engineering', content: 'This replaced three different tools we were paying for. The ROI is immediate.', rating: 5, source: 'TrustRadius', date: '6 days ago' },
                    { id: 'p8', author: 'Rachel Green', role: 'Product Manager', content: 'Very intuitive interface and the remote config is a lifesaver.', rating: 4.5, source: 'Capterra', date: '2 weeks ago' },
                    { id: 'p9', author: 'Tom Richards', role: 'Frontend Lead', content: 'Lightweight and fast. Did exactly what we needed without bloat.', rating: 5, source: 'G2', date: '3 weeks ago' },
                    { id: 'p10', author: 'Emma White', role: 'CEO at Innovate', content: 'Stunning designs. It instantly elevated our landing page credibility.', rating: 5, source: 'G2', date: '1 month ago' },
                ];

                // Send to iframe
                if (previewRef.current && previewRef.current.contentWindow) {
                    previewRef.current.contentWindow.postMessage({
                        type: 'PROOFLAYER_CONFIG_UPDATE',
                        config: config,
                        previewData: mockReviews
                    }, '*');
                }

                // Send to external popup window if it exists and is not closed
                if (window.externalPreviewRef && !window.externalPreviewRef.closed) {
                    window.externalPreviewRef.postMessage({
                        type: 'PROOFLAYER_CONFIG_UPDATE',
                        config: config,
                        previewData: mockReviews
                    }, '*');
                }
            }
        };

        if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = setTimeout(sendConfigUpdate, 100);
        
        return () => clearTimeout(previewTimeoutRef.current);
    }, [config, loading]);

    if (loading) {
        return (
            <div className="distribute-container">
                <div className="distribute-loading">
                    <FaSpinner className="spin" />
                    <span>Loading widget settings...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="distribute-container">
            <header className="distribute-header">
                <h1>Share & Distribute</h1>
                <p>Configure how your testimonials appear on client websites. Changes take effect on the next page load.</p>
            </header>

            <div className="distribute-grid">
                {/* LEFT COLUMN — Configurator */}
                <div className="config-column">

                    {/* Widget Style Section */}
                    <div className="config-section">
                        <h2><FaSlidersH /> Widget Configurator</h2>
                        <p className="config-subtitle">Customize layout, styling, and behavior rules.</p>

                        <div className="config-field">
                            <label>Widget Template</label>
                            <select value={config.template} onChange={(e) => updateConfig('template', e.target.value)}>
                                <option value="slider">Slider (Carousel)</option>
                                <option value="grid">Grid (Cards)</option>
                                <option value="popup">Popup Toast (Corner Notification)</option>
                                <option value="badge">Trust Badge (Compact)</option>
                            </select>
                        </div>

                        <div className="config-field">
                            <label>Theme Preset</label>
                            <select value={config.theme} onChange={(e) => updateConfig('theme', e.target.value)}>
                                <option value="glass">Glassmorphism (Frosted Glass)</option>
                                <option value="light">Light & Clean</option>
                                <option value="dark">Sleek Dark</option>
                                <option value="glowing">Glowing Neon Borders</option>
                            </select>
                        </div>

                        <div className="config-field">
                            <label>Max Testimonials: <strong>{config.limit}</strong></label>
                            <input
                                type="range"
                                min="1" max="10" step="1"
                                value={config.limit}
                                onChange={(e) => updateConfig('limit', parseInt(e.target.value))}
                            />
                        </div>

                        <div className="config-field">
                            <label>Source Filter</label>
                            <select value={config.sourceFilter} onChange={(e) => updateConfig('sourceFilter', e.target.value)}>
                                <option value="">Show All Sources</option>
                                <option value="G2">G2</option>
                                <option value="Capterra">Capterra</option>
                                <option value="TrustRadius">TrustRadius</option>
                            </select>
                        </div>
                    </div>

                    {/* Popup-specific options */}
                    {config.template === 'popup' && (
                        <div className="config-section">
                            <h2>🔔 Popup Options</h2>

                            <div className="config-field">
                                <label>Toast Corner Position</label>
                                <select value={config.position} onChange={(e) => updateConfig('position', e.target.value)}>
                                    <option value="bottom-right">Bottom Right</option>
                                    <option value="bottom-left">Bottom Left</option>
                                    <option value="top-right">Top Right</option>
                                    <option value="top-left">Top Left</option>
                                </select>
                            </div>

                            <div className="config-field">
                                <label>Rotate Interval: <strong>{(config.interval / 1000).toFixed(0)}s</strong></label>
                                <input
                                    type="range"
                                    min="3000" max="15000" step="1000"
                                    value={config.interval}
                                    onChange={(e) => updateConfig('interval', parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                    )}

                    {/* Position Nudge */}
                    <div className="config-section">
                        <h2><FaArrowsAlt /> Position & Alignment</h2>
                        <p className="config-subtitle">Fine-tune where the widget sits on the page.</p>

                        <div className="config-field">
                            <label>Alignment</label>
                            <div className="alignment-buttons">
                                {['left', 'center', 'right'].map(align => (
                                    <button
                                        key={align}
                                        className={`align-btn ${config.alignment === align ? 'active' : ''}`}
                                        onClick={() => updateConfig('alignment', align)}
                                    >
                                        {align === 'left' && '◀'}
                                        {align === 'center' && '◆'}
                                        {align === 'right' && '▶'}
                                        <span>{align.charAt(0).toUpperCase() + align.slice(1)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="config-row">
                            <div className="config-field">
                                <label>Horizontal Nudge: <strong>{config.offsetX}px</strong></label>
                                <input
                                    type="range"
                                    min="-100" max="100" step="5"
                                    value={config.offsetX}
                                    onChange={(e) => updateConfig('offsetX', parseInt(e.target.value))}
                                />
                            </div>
                            <div className="config-field">
                                <label>Vertical Nudge: <strong>{config.offsetY}px</strong></label>
                                <input
                                    type="range"
                                    min="-100" max="100" step="5"
                                    value={config.offsetY}
                                    onChange={(e) => updateConfig('offsetY', parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        className={`save-btn ${saveSuccess ? 'save-success' : ''}`}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <><FaSpinner className="spin" /> Saving...</>
                        ) : saveSuccess ? (
                            <><FaCheck /> Settings Saved!</>
                        ) : (
                            <><FaSave /> Save Settings</>
                        )}
                    </button>

                    {error && <p className="error-msg">⚠️ {error}</p>}
                    {configExists && !saveSuccess && (
                        <p className="config-status">✅ Config synced to cloud. Last saved settings are live.</p>
                    )}
                </div>

                {/* RIGHT COLUMN — Preview + Embed */}
                <div className="preview-column">
                    <div className="preview-section">
                        <div className="preview-header">
                            <div>
                                <h2><FaEye /> Live Preview</h2>
                                <span className="preview-badge-label">Updates in real-time</span>
                            </div>
                            <button onClick={openExternalPreview} className="external-preview-btn">
                                Open in New Tab ↗
                            </button>
                        </div>
                        <div className="preview-viewport" style={{ flexGrow: 1, padding: 0, overflow: 'hidden' }}>
                            <iframe 
                                ref={previewRef}
                                src="/demo/index.html?nocache=1"
                                style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#fff' }}
                                title="Client Website Preview"
                            />
                        </div>
                    </div>

                    <div className="embed-section">
                        <h2><FaCode /> Embed Code</h2>
                        <p className="config-subtitle">Paste this once in the client's website. All configuration is managed here.</p>
                        <div className="code-box">
                            <code>{embedCode}</code>
                            <button onClick={handleCopy} className="copy-btn" title="Copy to clipboard">
                                {copied ? <FaCheck style={{ color: '#10b981' }} /> : <FaCopy />}
                            </button>
                        </div>
                        <p className="hint">The client adds this before <code>&lt;/body&gt;</code>. They never need to change it.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Distribute;
