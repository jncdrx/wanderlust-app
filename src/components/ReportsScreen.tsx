import { useState, useEffect, useRef } from 'react';
import { TrendingUp, MapPin, Calendar, DollarSign, Award, ArrowLeft, Download, Share2, BarChart3, Star, Camera, Loader2, Globe, Image, CheckCircle2, Lock, Plane, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { apiClient } from '../api/client';
import { centeredToast } from './CenteredToast';
import { ProgressRing } from './ProgressRing';

interface ReportsScreenProps {
  currentUser?: any;
  trips?: any[];
  destinations?: any[];
  photos?: any[];
  onNavigate: (screen: string) => void;
  darkMode?: boolean;
}

// --- Utility Components ---

// 1. Section Header
const SectionHeader = ({ title, icon: Icon, darkMode }: { title: string; icon?: any; darkMode: boolean }) => (
  <div className="flex items-center gap-2 mb-4">
    {Icon && <Icon className={darkMode ? 'text-indigo-400' : 'text-indigo-600'} size={20} />}
    <h3 className={`text-lg font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
      {title}
    </h3>
  </div>
);

// 2. Empty State Component
const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction, 
  darkMode 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  actionLabel?: string; 
  onAction?: () => void; 
  darkMode: boolean; 
}) => (
  <div className={`flex flex-col items-center justify-center p-8 rounded-2xl border text-center transition-all h-64 ${
    darkMode 
      ? 'bg-slate-900/50 border-slate-800 text-slate-400' 
      : 'bg-slate-50 border-slate-200 text-slate-600'
  }`}>
    <div className={`p-4 rounded-full mb-4 ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-400 shadow-sm'}`}>
      <Icon size={48} />
    </div>
    <h4 className={`text-base font-semibold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{title}</h4>
    <p className="text-sm mb-4 max-w-xs mx-auto opacity-80">{description}</p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          darkMode 
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
      >
        <Plus size={16} />
        {actionLabel}
      </button>
    )}
  </div>
);

// 3. KPI Card
const KPICard = ({ 
  title, 
  value, 
  icon: Icon, 
  colorClass, 
  subtext, 
  description,
  darkMode 
}: { 
  title: string; 
  value: string; 
  icon: any; 
  colorClass: string; 
  subtext?: string; 
  description?: string;
  darkMode: boolean; 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`p-5 rounded-xl border shadow-sm relative overflow-hidden group transition-all duration-300 h-full flex flex-col justify-between ${
      darkMode 
        ? 'bg-slate-800/60 border-slate-700 hover:border-slate-600' 
        : 'bg-white border-slate-200 shadow-slate-200/50 hover:border-indigo-200'
    }`}
  >
    <div className="flex justify-between items-start mb-3">
      <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
        <Icon size={20} className={colorClass} />
      </div>
      {subtext && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          darkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-100 text-green-700'
        }`}>
          {subtext}
        </span>
      )}
    </div>
    <div>
      <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{title}</p>
      <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{value}</h3>
      {description && (
        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>
      )}
    </div>
  </motion.div>
);

// --- Main Screen ---

export function ReportsScreen({ currentUser, onNavigate, darkMode = false }: ReportsScreenProps) {
  const [timeframe, setTimeframe] = useState<'month' | 'year' | 'all'>('year');
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Dummy data state
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    const fetchReports = async () => {
      if (!currentUser?.id) return;

      setIsLoading(true);
      try {
        const data = await apiClient.getReports(currentUser.id, timeframe);
        setReportData(data);
      } catch (error) {
        console.warn("API Error, using fallback data");
        // Fallback Data
        setReportData({
          insights: [
            { title: 'Destinations Visited', value: '12', description: '+2 this month', progress: 12 },
            { title: 'Trips Completed', value: '5', description: 'On track', progress: 5 },
            { title: 'Total Budget', value: '₱45k', description: 'Under budget', progress: 85 },
          ],
          monthlyTrips: Array.from({ length: 12 }, (_, i) => ({
            month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
            trips: Math.floor(Math.random() * 8), 
          })),
          categoryData: [
            { name: 'Beach', count: 5 },
            { name: 'Mountain', count: 3 },
            { name: 'City', count: 8 },
          ],
          topDestinations: [
            { name: 'Palawan', location: 'Philippines', rating: 4.9 },
            { name: 'Kyoto', location: 'Japan', rating: 4.8 },
          ],
          achievements: [
            { title: 'First Trip', description: 'Complete your first trip', earned: true, progress: 1, maxProgress: 1 },
            { title: 'Photographer', description: 'Capture 50 photos', earned: true, progress: 50, maxProgress: 50 },
            { title: 'World Explorer', description: 'Visit 10 countries', earned: false, progress: 3, maxProgress: 10 },
            { title: 'Budget Master', description: 'Stay under budget 5 times', earned: false, progress: 2, maxProgress: 5 },
            { title: 'Social Butterfly', description: 'Share 5 trips', earned: false, progress: 1, maxProgress: 5 },
            { title: 'Luxury Traveler', description: 'Stay in 5-star hotel', earned: false, progress: 0, maxProgress: 1 },
          ],
          summary: {
            totalTrips: 5,
            uniqueLocations: 12,
            photosCaptured: 143,
            avgRating: '4.8',
          },
        });
      } finally {
        setTimeout(() => setIsLoading(false), 800);
      }
    };

    fetchReports();
  }, [currentUser?.id, timeframe]);

  // Priority 3: Download PDF Functionality
  const handleDownloadPDF = async () => {
    if (!reportData) return;
    setIsDownloading(true);

    try {
      // Create hidden PDF export container
      const pdfContainer = document.createElement('div');
      pdfContainer.className = 'pdf-export-container';
      pdfContainer.style.position = 'absolute';
      pdfContainer.style.left = '-9999px';
      pdfContainer.style.top = '0';
      pdfContainer.style.width = '800px';
      pdfContainer.style.backgroundColor = darkMode ? '#0f0f1a' : '#ffffff';
      pdfContainer.style.color = darkMode ? '#ffffff' : '#1a1a2e';
      pdfContainer.style.padding = '40px';
      pdfContainer.style.fontFamily = "'Outfit', 'DM Sans', sans-serif";
      document.body.appendChild(pdfContainer);

      // Build PDF content programmatically
      const timeframeLabel = timeframe === 'month' ? 'This Month' : timeframe === 'year' ? 'This Year' : 'All Time';
      const dateStr = new Date().toISOString().split('T')[0];
      const timestamp = new Date().toLocaleString();

      // Header
      const header = document.createElement('div');
      header.innerHTML = `
        <h1 class="pdf-title" style="font-size: 32px; font-weight: 700; margin-bottom: 10px; color: ${darkMode ? '#ffffff' : '#1a1a2e'};">Wanderlust Travel Report</h1>
        <p class="pdf-subtitle" style="font-size: 14px; color: ${darkMode ? '#94a3b8' : '#64748b'}; margin-bottom: 10px;">
          ${currentUser?.firstName ? `${currentUser.firstName}${currentUser.lastName ? ' ' + currentUser.lastName : ''}'s` : 'Your'} Travel Analytics - ${timeframeLabel}
        </p>
        <p style="font-size: 12px; color: ${darkMode ? '#94a3b8' : '#64748b'}; margin-bottom: 30px;">Generated on ${timestamp}</p>
      `;
      pdfContainer.appendChild(header);

      // Key Insights Section
      const insightsSection = document.createElement('div');
      insightsSection.className = 'pdf-section';
      insightsSection.style.marginBottom = '30px';
      insightsSection.style.padding = '20px';
      insightsSection.style.backgroundColor = darkMode ? '#1a1a2e' : '#f8fafc';
      insightsSection.style.border = `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;
      insightsSection.style.borderRadius = '12px';
      
      insightsSection.innerHTML = `
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 20px; color: ${darkMode ? '#ffffff' : '#1a1a2e'};">Key Insights</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 15px;">
          ${reportData.insights.map((insight: any) => `
            <div class="pdf-stat-card" style="display: inline-block; padding: 15px 20px; background-color: ${darkMode ? '#1e293b' : '#ffffff'}; border: 1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}; border-radius: 8px; min-width: 200px;">
              <div class="pdf-stat-value" style="font-size: 24px; font-weight: 700; color: ${darkMode ? '#ffffff' : '#1a1a2e'}; margin-bottom: 5px;">${insight.value}</div>
              <div class="pdf-stat-label" style="font-size: 12px; color: ${darkMode ? '#94a3b8' : '#64748b'}; text-transform: uppercase; letter-spacing: 0.5px;">${insight.title}</div>
              ${insight.description ? `<div style="font-size: 11px; color: ${darkMode ? '#64748b' : '#94a3b8'}; margin-top: 5px;">${insight.description}</div>` : ''}
            </div>
          `).join('')}
        </div>
      `;
      pdfContainer.appendChild(insightsSection);

      // Achievements Section
      const achievementsSection = document.createElement('div');
      achievementsSection.className = 'pdf-section';
      achievementsSection.style.marginBottom = '30px';
      achievementsSection.style.padding = '20px';
      achievementsSection.style.backgroundColor = darkMode ? '#1a1a2e' : '#f8fafc';
      achievementsSection.style.border = `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;
      achievementsSection.style.borderRadius = '12px';
      
      const earnedAchievements = reportData.achievements.filter((a: any) => a.earned);
      const earnedCount = earnedAchievements.length;
      const totalCount = reportData.achievements.length;
      
      const achievementsHtml = earnedAchievements.map((ach: any) => {
        const borderColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = darkMode ? '#ffffff' : '#1a1a2e';
        const secondaryColor = darkMode ? '#94a3b8' : '#64748b';
        return `<div class="pdf-list-item" style="padding: 10px 0; border-bottom: 1px solid ${borderColor}; color: ${textColor};">
          <div style="font-weight: 600; margin-bottom: 5px;">✓ ${ach.title}</div>
          <div style="font-size: 12px; color: ${secondaryColor};">${ach.description}</div>
        </div>`;
      }).join('');
      
      const noAchievementsHtml = earnedCount === 0 
        ? `<div style="color: ${darkMode ? '#94a3b8' : '#64748b'}; font-style: italic;">No achievements earned yet</div>`
        : '';
      
      achievementsSection.innerHTML = `
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 20px; color: ${darkMode ? '#ffffff' : '#1a1a2e'};">Achievements</h2>
        <p style="font-size: 14px; color: ${darkMode ? '#94a3b8' : '#64748b'}; margin-bottom: 15px;">
          ${earnedCount} of ${totalCount} achievements earned
        </p>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${achievementsHtml}
          ${noAchievementsHtml}
        </div>
      `;
      pdfContainer.appendChild(achievementsSection);

      // Summary Stats Section
      const summarySection = document.createElement('div');
      summarySection.className = 'pdf-section';
      summarySection.style.marginBottom = '30px';
      summarySection.style.padding = '20px';
      summarySection.style.backgroundColor = darkMode ? '#1a1a2e' : '#f8fafc';
      summarySection.style.border = `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;
      summarySection.style.borderRadius = '12px';
      
      summarySection.innerHTML = `
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 20px; color: ${darkMode ? '#ffffff' : '#1a1a2e'};">Summary</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
          <div style="padding: 15px; background-color: ${darkMode ? '#1e293b' : '#ffffff'}; border: 1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}; border-radius: 8px;">
            <div style="font-size: 28px; font-weight: 700; color: ${darkMode ? '#ffffff' : '#1a1a2e'}; margin-bottom: 5px;">${reportData.summary.totalTrips}</div>
            <div style="font-size: 12px; color: ${darkMode ? '#94a3b8' : '#64748b'}; text-transform: uppercase;">Trips</div>
          </div>
          <div style="padding: 15px; background-color: ${darkMode ? '#1e293b' : '#ffffff'}; border: 1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}; border-radius: 8px;">
            <div style="font-size: 28px; font-weight: 700; color: ${darkMode ? '#ffffff' : '#1a1a2e'}; margin-bottom: 5px;">${reportData.summary.uniqueLocations}</div>
            <div style="font-size: 12px; color: ${darkMode ? '#94a3b8' : '#64748b'}; text-transform: uppercase;">Places</div>
          </div>
          <div style="padding: 15px; background-color: ${darkMode ? '#1e293b' : '#ffffff'}; border: 1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}; border-radius: 8px;">
            <div style="font-size: 28px; font-weight: 700; color: ${darkMode ? '#ffffff' : '#1a1a2e'}; margin-bottom: 5px;">${reportData.summary.photosCaptured}</div>
            <div style="font-size: 12px; color: ${darkMode ? '#94a3b8' : '#64748b'}; text-transform: uppercase;">Photos</div>
          </div>
          <div style="padding: 15px; background-color: ${darkMode ? '#1e293b' : '#ffffff'}; border: 1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}; border-radius: 8px;">
            <div style="font-size: 28px; font-weight: 700; color: ${darkMode ? '#ffffff' : '#1a1a2e'}; margin-bottom: 5px;">${reportData.summary.avgRating}</div>
            <div style="font-size: 12px; color: ${darkMode ? '#94a3b8' : '#64748b'}; text-transform: uppercase;">Rating</div>
          </div>
        </div>
      `;
      pdfContainer.appendChild(summarySection);

      // Footer
      const footer = document.createElement('div');
      footer.className = 'pdf-footer';
      footer.style.marginTop = '40px';
      footer.style.paddingTop = '20px';
      footer.style.borderTop = `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`;
      footer.style.fontSize = '12px';
      footer.style.color = darkMode ? '#94a3b8' : '#64748b';
      footer.style.textAlign = 'center';
      footer.innerHTML = `
        <p>Generated by Wanderlust Travel App</p>
        <p style="margin-top: 5px;">${timestamp}</p>
      `;
      pdfContainer.appendChild(footer);

      // Convert to canvas
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: darkMode ? '#0f0f1a' : '#ffffff',
        logging: false,
        allowTaint: true
      });

      // Remove container from DOM
      document.body.removeChild(pdfContainer);

      // Generate PDF with multi-page support
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // Download PDF
      const timeframeLabelShort = timeframe === 'month' ? 'month' : timeframe === 'year' ? 'year' : 'all-time';
      const filename = `wanderlust-report-${timeframeLabelShort}-${dateStr}.pdf`;
      pdf.save(filename);
      
      centeredToast.success('Report downloaded successfully!');
    } catch (error: any) {
      console.error('PDF Generation failed', error);
      centeredToast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Priority 3: Share Functionality
  const handleShare = async () => {
    if (!reportData) return;
    setIsSharing(true);

    try {
      // Simulate generating a unique share ID
      const shareId = crypto.randomUUID();
      const shareData = {
        data: reportData,
        user: currentUser?.firstName,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };

      // Mock storage
      localStorage.setItem(`wanderlust_share_${shareId}`, JSON.stringify(shareData));

      const shareUrl = `${window.location.origin}/reports/share/${shareId}`;
      await navigator.clipboard.writeText(shareUrl);
      
      centeredToast.success('Share link copied to clipboard!');
    } catch (err) {
      console.error(err);
      centeredToast.error('Failed to create share link');
    } finally {
      setIsSharing(false);
    }
  };

  if (isLoading || !reportData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-[#0f0f1a]' : 'bg-[#faf8f5]'}`}>
        <Loader2 className={`animate-spin ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} size={32} />
      </div>
    );
  }

  const { insights, monthlyTrips, topDestinations, achievements, summary } = reportData;
  const kpiIcons = [MapPin, CheckCircle2, DollarSign];
  const kpiColors = ['text-blue-500', 'text-green-500', 'text-amber-500'];

  return (
    <div className={`min-h-screen pb-32 transition-colors duration-300 ${darkMode ? 'bg-[#0f0f1a]' : 'bg-[#faf8f5]'}`}>
      
      {/* --- Top Navigation & Header --- */}
      <div className={`sticky top-0 z-20 backdrop-blur-xl border-b ${darkMode ? 'bg-[#0f0f1a]/80 border-white/10' : 'bg-[#faf8f5]/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('home')}
                className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-200 text-slate-800'}`}
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Reports & Insights
                </h1>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Overview for {currentUser?.firstName || 'User'}
                </p>
              </div>
            </div>

            {/* Time Filter Toggles */}
            <div className={`flex p-1 rounded-lg no-print ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
              {(['month', 'year', 'all'] as const).map((period) => (
                <motion.button
                  key={period}
                  onClick={() => setTimeframe(period)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className={`relative px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    timeframe === period
                      ? darkMode 
                        ? 'text-white bg-slate-700 shadow-lg shadow-slate-900/50 font-bold' 
                        : 'text-indigo-600 bg-white shadow-lg shadow-indigo-200/50 font-bold'
                      : darkMode 
                        ? 'text-slate-400 hover:text-white' 
                        : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {period === 'month' ? 'This Month' : period === 'year' ? 'This Year' : 'All Time'}
                </motion.button>
              ))}
            </div>

            {/* Actions (Priority 3) */}
            <div className="flex items-center gap-2 no-print">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShare}
                disabled={isSharing}
                className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                  darkMode
                    ? 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title="Share Report"
              >
                {isSharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className={`flex items-center gap-2 p-3 rounded-xl transition-all shadow-md ${
                  darkMode
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                } disabled:opacity-70 disabled:cursor-wait`}
                title="Download PDF"
              >
                {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Ref for PDF */}
      <div ref={reportRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Priority 1: KPI Cards 3-Column Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 gap-y-6 mb-6">
          {insights.map((insight: any, idx: number) => (
            <KPICard 
              key={idx}
              title={insight.title}
              value={insight.value}
              icon={kpiIcons[idx] || TrendingUp}
              colorClass={kpiColors[idx] || 'text-indigo-500'}
              subtext={insight.progress > 0 ? `+${insight.progress}%` : undefined}
              description={insight.description}
              darkMode={darkMode}
            />
          ))}
        </section>

        {/* Priority 5: Interactive Monthly Activity Chart */}
        <section>
          <SectionHeader title="Monthly Activity" icon={BarChart3} darkMode={darkMode} />
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
            {monthlyTrips.reduce((a: number, b: any) => a + b.trips, 0) === 0 ? (
               <EmptyState 
                 icon={BarChart3}
                 title="No activity yet"
                 description="Once you start planning trips, your monthly activity will appear here."
                 actionLabel="Plan a Trip"
                 onAction={() => onNavigate('trips')}
                 darkMode={darkMode}
               />
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrips} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#334155" : "#e2e8f0"} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: darkMode ? "#94a3b8" : "#64748b", fontSize: 12 }} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: darkMode ? "#94a3b8" : "#64748b", fontSize: 12 }} 
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <RechartsTooltip 
                      cursor={{ fill: darkMode ? '#334155' : '#f1f5f9', opacity: 0.4 }}
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#1e293b' : '#fff',
                        borderColor: darkMode ? '#334155' : '#e2e8f0',
                        borderRadius: '12px',
                        color: darkMode ? '#fff' : '#0f172a'
                      }}
                    />
                    <Bar dataKey="trips" radius={[4, 4, 0, 0]} animationDuration={1500}>
                      {monthlyTrips.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={darkMode ? '#818cf8' : '#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Priority 2: Enhanced Achievements (2/3 width) */}
          <section className="lg:col-span-2">
            <SectionHeader title="Achievements" icon={Award} darkMode={darkMode} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {achievements.map((ach: any, idx: number) => {
                 const percent = ach.maxProgress > 0 ? (ach.progress / ach.maxProgress) * 100 : 0;
                 const Icon = [Award, MapPin, Camera, Calendar, Globe, DollarSign][idx] || Award;
                 return (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: ach.earned ? 1.02 : 1.01 }}
                    transition={{ duration: 0.2 }}
                    className={`p-4 rounded-xl border flex items-center gap-4 transition-all overflow-hidden relative ${
                      darkMode 
                        ? `bg-slate-800/40 border-slate-700 ${!ach.earned ? 'opacity-50 grayscale-[0.4]' : 'opacity-100'}`
                        : `bg-white border-slate-200 shadow-sm ${!ach.earned ? 'bg-slate-50/60 opacity-60 grayscale-[0.3]' : 'opacity-100'}`
                    }`}
                  >
                    {/* Icon badge (top-left) */}
                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                      <Icon size={20} className={ach.earned ? (darkMode ? 'text-amber-400' : 'text-amber-600') : (darkMode ? 'text-slate-400' : 'text-slate-500')} />
                    </div>
                    
                    {/* ProgressRing (center) */}
                    <div className="shrink-0">
                      <ProgressRing 
                        progress={ach.progress} 
                        maxProgress={ach.maxProgress}
                        isEarned={ach.earned}
                        darkMode={darkMode}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0 z-10">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className={`font-semibold text-sm truncate ${darkMode ? 'text-white' : 'text-slate-900'} ${ach.earned ? '' : 'opacity-80'}`}>
                          {ach.title}
                        </h4>
                        {/* Lock Icon for unearned, Earned badge for earned */}
                        {ach.earned ? (
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'
                          }`}>
                            Earned
                          </span>
                        ) : (
                          <Lock size={14} className="text-slate-400" />
                        )}
                      </div>
                      <p className={`text-xs truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {ach.description}
                      </p>
                      
                      {/* Text details for accessibility */}
                      <p className={`text-[10px] mt-1 font-mono ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        {ach.progress} / {ach.maxProgress}
                      </p>
                    </div>

                    {/* Gold checkmark badge in top-right corner for earned - 32px diameter */}
                    {ach.earned && (
                      <>
                        <div className="absolute -top-1 -right-1 w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/50 z-20 border-2 border-white/30">
                          <span className="text-white text-[16px] font-bold leading-none">✓</span>
                        </div>
                        {/* Background glow for earned */}
                        <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full blur-2xl opacity-20 pointer-events-none ${darkMode ? 'bg-amber-400' : 'bg-amber-500'}`} />
                      </>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Priority 4: Summary Stats 2x2 Grid (1/3 width) */}
          <section>
            <SectionHeader title="Summary" icon={TrendingUp} darkMode={darkMode} />
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'Trips', val: summary.totalTrips, icon: TrendingUp, gradient: darkMode ? 'from-blue-500/30 to-blue-600/20' : 'from-blue-500/20 to-blue-600/10' },
                { label: 'Places', val: summary.uniqueLocations, icon: MapPin, gradient: darkMode ? 'from-emerald-500/30 to-emerald-600/20' : 'from-emerald-500/20 to-emerald-600/10' },
                { label: 'Photos', val: summary.photosCaptured, icon: Camera, gradient: darkMode ? 'from-pink-500/30 to-pink-600/20' : 'from-pink-500/20 to-pink-600/10' },
                { label: 'Rating', val: summary.avgRating, icon: Star, gradient: darkMode ? 'from-yellow-500/30 to-yellow-600/20' : 'from-yellow-500/20 to-yellow-600/10' }
              ].map((stat, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ scale: 1.02, opacity: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`p-5 rounded-2xl border relative overflow-hidden ${
                    darkMode 
                      ? 'bg-[#1a1a2e]/60 border-white/10' 
                      : 'bg-white border-black/5 shadow-sm'
                  }`}
                  style={{
                    boxShadow: darkMode
                      ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                      : '0 4px 20px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  {/* Icon badge - 40px circle, top-right */}
                  <div className={`absolute top-4 right-4 w-10 h-10 rounded-full bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-md`}>
                    <stat.icon size={20} className="text-white" />
                  </div>
                  
                  {/* Value and Label */}
                  <div className="flex flex-col justify-between h-full">
                    <span className={`text-[32px] font-bold tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                      {stat.val}
                    </span>
                    <span className={`text-xs font-medium uppercase tracking-wide ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      {stat.label}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* Top Destinations (Full Width) */}
        <section>
           <SectionHeader title="Top Destinations" icon={Globe} darkMode={darkMode} />
           {topDestinations.length === 0 ? (
             <EmptyState 
               icon={MapPin}
               title="Bucket list is empty"
               description="Start exploring amazing places to add to your wishlist."
               actionLabel="Explore Places"
               onAction={() => onNavigate('places')}
               darkMode={darkMode}
             />
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {topDestinations.map((dest: any, idx: number) => (
                 <motion.div 
                   key={idx}
                   whileHover={{ y: -2 }}
                   className={`flex items-center gap-4 p-4 rounded-xl border ${
                     darkMode 
                       ? 'bg-slate-800/60 border-slate-700' 
                       : 'bg-white border-slate-200 shadow-sm'
                   }`}
                 >
                   <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                      idx === 0 ? 'bg-yellow-500 text-white' :
                      idx === 1 ? 'bg-slate-400 text-white' :
                      idx === 2 ? 'bg-orange-400 text-white' :
                      darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                   }`}>
                     #{idx + 1}
                   </div>
                   <div className="flex-1">
                     <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{dest.name}</h4>
                     <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{dest.location}</p>
                   </div>
                   <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded">
                     <Star size={14} className="text-yellow-500" fill="currentColor" />
                     <span className="text-sm font-bold text-yellow-500">{dest.rating}</span>
                   </div>
                 </motion.div>
               ))}
             </div>
           )}
        </section>

      </div>
    </div>
  );
}
