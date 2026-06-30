import React, { useState, useEffect } from 'react';
import { getDistributionReviews, getDistributionApiUrl } from '../../services/distributionService';
import { FaCopy, FaCheck, FaExternalLinkAlt, FaSpinner, FaCode, FaLink } from 'react-icons/fa';
import './Distribute.css';

const Distribute = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('preview');

    useEffect(() => {
        const loadReviews = async () => {
            setLoading(true);
            const data = await getDistributionReviews({ maxReviews: 6 });
            setReviews(data);
            setLoading(false);
        };
        loadReviews();
    }, []);

    const embedCode = `<script src="https://prooflayer.io/pixel.js" data-token="YOUR_TOKEN"></script>`;

    const handleCopy = () => {
        navigator.clipboard.writeText(embedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="distribute-container">
            <header className="distribute-header">
                <h1>Share & Embed</h1>
                <p>Generate an embed code or API link to showcase your best testimonials on your website. Copy the code below to get started.</p>
            </header>

            <div className="distribute-content">
                <div className="setup-section">
                    <h2><FaCode /> Setup Guide</h2>
                    <div className="code-box">
                        <code>{embedCode}</code>
                        <button onClick={handleCopy} className="copy-btn">
                            {copied ? <FaCheck className="text-green-500" /> : <FaCopy />}
                        </button>
                    </div>
                    <p className="hint">Paste this code into the <code>&lt;head&gt;</code> of your website.</p>
                </div>

                <div className="setup-section">
                    <h2><FaLink /> REST API Endpoint</h2>
                    <div className="code-box">
                        <code>{getDistributionApiUrl()}</code>
                        <a href={getDistributionApiUrl()} target="_blank" rel="noreferrer" className="copy-btn">
                            <FaExternalLinkAlt title="Open Static Fallback" />
                        </a>
                    </div>
                    <p className="hint">Note: This <code>.json</code> URL is a static fallback. Use the <b>API Response</b> tab below to see your live shared data.</p>

                    {reviews.length > 0 && (
                        <button
                            onClick={() => {
                                const blob = new Blob([JSON.stringify(reviews, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'live_reviews_api.json';
                                a.click();
                            }}
                            className="mt-2 py-1 px-3 bg-blue-50 text-blue-600 rounded text-xs font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1 w-fit"
                        >
                            <FaCopy /> Download Current Live JSON
                        </button>
                    )}
                </div>

                <div className="preview-section">
                    <div className="preview-tabs">
                        <button
                            className={activeTab === 'preview' ? 'active' : ''}
                            onClick={() => setActiveTab('preview')}
                        >
                            Widget Preview
                        </button>
                        <button
                            className={activeTab === 'api' ? 'active' : ''}
                            onClick={() => setActiveTab('api')}
                        >
                            API Response
                        </button>
                    </div>

                    <div className="preview-body">
                        {loading ? (
                            <div className="loading">
                                <FaSpinner className="animate-spin" /> Fetching latest reviews...
                            </div>
                        ) : activeTab === 'preview' ? (
                            <div className="widget-mockup">
                                <h3>Customer Love ({reviews.length} shared)</h3>
                                {reviews.length === 0 ? (
                                    <p className="text-xs text-center py-8 text-gray-400">Go to Dashboard and "Share" some reviews to see them here!</p>
                                ) : (
                                    <div className="reviews-carousel">
                                        {reviews.map((r, i) => (
                                            <div key={r.id || i} className="mini-card">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-600 text-xs">
                                                        {r.author?.[0] || 'A'}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold">{r.author}</p>
                                                        <div className="flex text-[10px] text-yellow-500">
                                                            {[...Array(5)].map((_, i) => (
                                                                <span key={i}>{i < Math.floor(r.rating || 5) ? '★' : '☆'}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] line-clamp-2 text-gray-600">"{r.content}"</p>
                                                <span className="source-tag">{r.source}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="api-mockup">
                                <pre>{JSON.stringify(reviews, null, 2)}</pre>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Distribute;
