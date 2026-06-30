import React, { useState, useEffect } from 'react';
import { FaRobot, FaSpinner, FaCheckCircle, FaExclamationCircle, FaFilter } from 'react-icons/fa';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { CustomNLPModel } from '../../services/CustomNLPModel';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import TestimonialCard from '../../components/TestimonialCard/TestimonialCard';
import './AIInsights.css';

const COLORS = ['#10b981', '#ef4444', '#f59e0b']; // Positive (Green), Negative (Red), Neutral (Yellow)

const AIInsightsPanel = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [allReviews, setAllReviews] = useState([]);
  const [selectedSentiment, setSelectedSentiment] = useState(null);
  const [error, setError] = useState('');

  const fetchInsights = async () => {
    setLoading(true);
    setError('');
    setData(null);
    setAllReviews([]);
    setSelectedSentiment(null);

    try {
      // 1. Fetch reviews securely from Frontend
      const q = query(collection(db, 'testimonials'), where('status', '==', 'active'));
      const querySnapshot = await getDocs(q);
      const reviews = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (reviews.length === 0) {
         setData({ sentiment: 'Neutral', themes: [], pros: [], cons: [], summary: 'No reviews found.' });
         return;
      }
      
      const aiModel = new CustomNLPModel();
      
      // 2. Process each review individually for filtering
      const processedReviews = reviews.map(review => {
        const result = aiModel.predict(review.content);
        return {
          ...review,
          sentiment: result.sentiment // 'Positive', 'Negative', or 'Neutral'
        };
      });

      setAllReviews(processedReviews);

      // 3. Run aggregated analysis
      const allText = reviews.map(r => r.content).join(' . ');
      const analysis = aiModel.predict(allText);

      // 4. Override chart data with ACTUAL counts from processed reviews
      const positiveCount = processedReviews.filter(r => r.sentiment === 'Positive').length;
      const negativeCount = processedReviews.filter(r => r.sentiment === 'Negative').length;
      const neutralCount = processedReviews.filter(r => r.sentiment === 'Neutral' || r.sentiment === 'Mixed').length;

      analysis.chartData.sentiment = [
        { name: 'Positive', value: positiveCount },
        { name: 'Negative', value: negativeCount },
        { name: 'Neutral', value: neutralCount }
      ].filter(item => item.value > 0); // Hide slices with 0 count

      // Competitive Benchmarking Mock Data Simulation
      const mockCompetitorTexts = "Terrible experience, very laggy. The price is too high. Support was helpful but slow. Interface is confusing. It crashes downwards. Value is poor. Confusing UX.";
      const competitorAnalysis = aiModel.predict(mockCompetitorTexts);

      const radarDataMap = {};
      
      analysis.chartData.aspects.forEach(aspect => {
        const total = aspect.Positive + aspect.Negative;
        const score = total > 0 ? (aspect.Positive / total) * 100 : 50;
        radarDataMap[aspect.name] = { subject: aspect.name, 'Our Product': Math.round(score), 'Competitor X': 50 };
      });

      competitorAnalysis.chartData.aspects.forEach(aspect => {
        const total = aspect.Positive + aspect.Negative;
        const score = total > 0 ? (aspect.Positive / total) * 100 : 50;
        if (radarDataMap[aspect.name]) {
           radarDataMap[aspect.name]['Competitor X'] = Math.round(score);
        } else {
           radarDataMap[aspect.name] = { subject: aspect.name, 'Our Product': 50, 'Competitor X': Math.round(score) };
        }
      });
      
      analysis.radarData = Object.values(radarDataMap).slice(0, 5);

      setData(analysis);
    } catch (err) {
      console.error(err);
      setError('An error occurred while compiling the AI model results.');
    } finally {
      setLoading(false);
    }
  };

  const handlePieClick = (data, index) => {
    if (data && data.name) {
      setSelectedSentiment(data.name);
      // Scroll to reviews section
      document.getElementById('review-explorer')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredReviews = selectedSentiment 
    ? allReviews.filter(r => r.sentiment === selectedSentiment)
    : allReviews;

  return (
    <div className="flex flex-col w-full h-full bg-background animate-fadeIn pb-20">
      <header className="flex flex-col gap-6 px-6 py-8 md:px-10 md:py-8 border-b border-slate-200 bg-surface shadow-sm z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-bold text-slate-800 m-0 tracking-tight flex items-center gap-3">
              <FaRobot className="text-indigo-600" />
              AI Analysis
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Run our AI model to automatically analyze sentiments, identify key themes, and extract pros and cons.</p>
          </div>
          {!loading && (
            <button 
              onClick={fetchInsights}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-2.5 font-semibold transition-all duration-200 shadow-sm flex items-center gap-2 border-none"
            >
              {data ? 'Refresh Analysis' : 'Analyze Reviews'}
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
        {!data && !loading && !error && (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-surface border border-slate-200 rounded-2xl shadow-sm mt-10">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
              <FaRobot size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Ready to Analyze</h2>
            <p className="text-slate-500 mb-6 max-w-md">
              Our AI will process all active reviews to determine overall sentiment, extract key themes, and identify pros and cons.
            </p>
            <button 
              onClick={fetchInsights}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 py-3 font-semibold transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 border-none"
            >
              Start AI Analysis
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center p-20">
            <FaSpinner className="animate-spin text-4xl text-indigo-600 mb-4" />
            <span className="font-medium text-slate-600 text-lg">AI is analyzing your reviews...</span>
          </div>
        )}

        {error && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl flex items-center gap-4 text-red-700">
            <FaExclamationCircle size={24} />
            <div>
              <h3 className="font-bold">Analysis Failed</h3>
              <p className="text-sm">{error}</p>
            </div>
            <button onClick={fetchInsights} className="ml-auto bg-white border border-red-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50">
              Try Again
            </button>
          </div>
        )}

        {data && !loading && (
          <div className="flex flex-col gap-10 animate-fadeIn">
            {/* Executive Summary Section */}
            <section>
              <div className="bg-surface p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  Executive Summary
                </h2>
                <p className="text-slate-600 leading-relaxed text-lg">{data.summary}</p>
              </div>
            </section>

            {/* Analytics Grid */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sentiment Breakdown with Click functionality */}
              <div className="bg-surface p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
                <div className="flex justify-between items-center w-full mb-6">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Sentiment Breakdown</h3>
                  <p className="text-[10px] text-slate-400 italic">Click slice to filter reviews</p>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.chartData?.sentiment || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        onClick={handlePieClick}
                        className="cursor-pointer focus:outline-none"
                      >
                        {(data.chartData?.sentiment || []).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                            strokeWidth={selectedSentiment === entry.name ? 4 : 1}
                            stroke={selectedSentiment === entry.name ? '#fff' : 'none'}
                          />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Aspect Analysis */}
              <div className="bg-surface p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-80">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 text-center">Sentiment by Aspect</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.chartData?.aspects || []} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} width={100} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="top" height={36}/>
                    <Bar dataKey="Positive" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Negative" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Pros and Cons Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-surface p-6 rounded-2xl border border-green-100 shadow-sm">
                <h3 className="text-sm font-bold text-green-600 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <FaCheckCircle /> Key Strengths
                </h3>
                <ul className="space-y-4">
                  {data.pros?.map((pro, idx) => (
                    <li key={idx} className="flex gap-3 text-slate-700 bg-green-50/50 p-3 rounded-xl border border-green-50">
                      <span className="text-green-500 font-bold">#</span>
                      <span className="font-medium">{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-surface p-6 rounded-2xl border border-red-100 shadow-sm">
                <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-6 flex items-center gap-2">
                  <FaExclamationCircle /> Areas for Improvement
                </h3>
                <ul className="space-y-4">
                  {data.cons?.map((con, idx) => (
                    <li key={idx} className="flex gap-3 text-slate-700 bg-red-50/50 p-3 rounded-xl border border-red-50">
                      <span className="text-red-500 font-bold">!</span>
                      <span className="font-medium">{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* NEW SECTION: Review Explorer */}
            <section id="review-explorer" className="mt-8 pt-10 border-t border-slate-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 m-0 flex items-center gap-3">
                    <FaFilter className="text-indigo-500 text-xl" />
                    Review Explorer
                  </h2>
                  <p className="text-slate-500 mt-1">Browse testimonials categorized by AI-detected sentiment.</p>
                </div>
                
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                  <button 
                    onClick={() => setSelectedSentiment(null)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border-none ${!selectedSentiment ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    All ({allReviews.length})
                  </button>
                  <button 
                    onClick={() => setSelectedSentiment('Positive')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border-none ${selectedSentiment === 'Positive' ? 'bg-green-500 text-white shadow-sm' : 'text-slate-500 hover:text-green-600'}`}
                  >
                    Positive ({allReviews.filter(r => r.sentiment === 'Positive').length})
                  </button>
                  <button 
                    onClick={() => setSelectedSentiment('Neutral')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border-none ${selectedSentiment === 'Neutral' ? 'bg-yellow-500 text-white shadow-sm' : 'text-slate-500 hover:text-yellow-600'}`}
                  >
                    Neutral ({allReviews.filter(r => r.sentiment === 'Neutral').length})
                  </button>
                  <button 
                    onClick={() => setSelectedSentiment('Negative')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border-none ${selectedSentiment === 'Negative' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:text-red-600'}`}
                  >
                    Negative ({allReviews.filter(r => r.sentiment === 'Negative').length})
                  </button>
                </div>
              </div>

              {filteredReviews.length === 0 ? (
                <div className="text-center py-20 bg-surface rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-medium">No {selectedSentiment} reviews found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredReviews.map((review) => (
                    <div key={review.id} className="relative group">
                      <div className={`absolute -top-2 -right-2 z-10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${
                        review.sentiment === 'Positive' ? 'bg-green-500 text-white' :
                        review.sentiment === 'Negative' ? 'bg-red-500 text-white' :
                        'bg-yellow-500 text-white'
                      }`}>
                        {review.sentiment}
                      </div>
                      <TestimonialCard testimonial={review} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default AIInsightsPanel;
