import React, { useEffect, useState } from 'react';
import { AnalyticsData, LinkItem } from '../types.js';
import { api } from '../lib/api.js';
import { 
  BarChart3, MapPin, Smartphone, Monitor, Tablet, Bot, Globe, 
  Share2, Clock, Users, RefreshCw, X, ExternalLink, Calendar,
  ShieldCheck, CheckCircle2, ShieldAlert
} from 'lucide-react';

interface LinkAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: LinkItem | null;
  isAdmin?: boolean;
}

export const LinkAnalyticsModal: React.FC<LinkAnalyticsModalProps> = ({
  isOpen,
  onClose,
  link,
  isAdmin = false
}) => {
  if (!isOpen || !link) return null;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'region' | 'channel' | 'device' | 'logs'>('overview');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = isAdmin
        ? await api.getAdminAnalytics(link.id, selectedPeriod)
        : await api.getUserAnalytics(link.id, selectedPeriod);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Không thể tải dữ liệu phân tích');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && link) {
      fetchAnalytics();
    }
  }, [isOpen, link?.id, selectedPeriod, isAdmin]);

  const getDeviceIcon = (name: string) => {
    if (name.includes('Mobile') || name.includes('Smartphone')) return <Smartphone className="w-4 h-4 text-blue-500" />;
    if (name.includes('Desktop') || name.includes('Máy tính')) return <Monitor className="w-4 h-4 text-emerald-500" />;
    if (name.includes('Tablet')) return <Tablet className="w-4 h-4 text-purple-500" />;
    return <Bot className="w-4 h-4 text-amber-500" />;
  };

  const getChannelColor = (name: string) => {
    if (name.includes('Facebook')) return 'bg-blue-600 text-white';
    if (name.includes('Zalo')) return 'bg-blue-500 text-white';
    if (name.includes('Google')) return 'bg-red-500 text-white';
    if (name.includes('TikTok')) return 'bg-slate-900 text-white';
    if (name.includes('Telegram')) return 'bg-sky-500 text-white';
    if (name.includes('Instagram')) return 'bg-pink-600 text-white';
    return 'bg-slate-600 text-white';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Phân Tích Chi Tiết Link: <span className="font-mono text-indigo-600">/{link.slug}</span>
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                {link.title || link.destination_url}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition flex items-center justify-center"
              title="Tải lại"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Link Info Banner */}
        <div className="px-5 py-2.5 bg-indigo-50/40 border-b border-indigo-100/60 text-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-slate-600 shrink-0">Đích đến:</span>
            <a
              href={link.destination_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline truncate font-mono flex items-center gap-1"
            >
              {link.destination_url}
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500 shrink-0">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              Tạo ngày: {new Date(link.created_at).toLocaleDateString('vi-VN')}
            </span>
            {link.expires_at && (
              <span className="text-amber-700 font-medium">
                Hết hạn: {new Date(link.expires_at).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>
        </div>

        {/* Modal Controls & Period Filter */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 bg-white">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: 'overview', label: 'Tổng Quan', icon: BarChart3 },
              { id: 'region', label: 'Vùng Miền', icon: MapPin },
              { id: 'channel', label: 'Kênh Traffic', icon: Share2 },
              { id: 'device', label: 'Thiết Bị', icon: Smartphone },
              { id: 'logs', label: 'Nhật Ký Click', icon: Clock }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Period Filter Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'today', label: 'Hôm nay' },
              { id: '7d', label: '7 ngày' },
              { id: '30d', label: '30 ngày' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  selectedPeriod === p.id
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
              <p className="text-xs font-medium">Đang tải số liệu thống kê chi tiết...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-500 text-xs bg-rose-50 rounded-xl border border-rose-100">
              {error}
            </div>
          ) : data ? (
            <>
              {/* Summary Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Tổng Lượt Click
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{data.total_clicks}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Toàn bộ lượt truy cập ghi nhận</div>
                </div>

                <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                  <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    Người Dùng Thực
                  </div>
                  <div className="text-2xl font-bold text-emerald-900 flex items-baseline gap-1.5">
                    {data.human_clicks}
                    <span className="text-xs font-bold text-emerald-600">({data.human_percent}%)</span>
                  </div>
                  <div className="w-full bg-emerald-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${data.human_percent}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-amber-50/60 border border-amber-100 rounded-xl">
                  <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5" />
                    Bot Preview Crawler
                  </div>
                  <div className="text-2xl font-bold text-amber-900 flex items-baseline gap-1.5">
                    {data.bot_clicks}
                    <span className="text-xs font-bold text-amber-600">({data.bot_percent}%)</span>
                  </div>
                  <div className="w-full bg-amber-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${data.bot_percent}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                  <div className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    Top Vùng Miền
                  </div>
                  <div className="text-sm font-bold text-indigo-900 truncate">
                    {data.regions.length > 0 ? data.regions[0].name : 'Chưa có'}
                  </div>
                  <div className="text-[10px] text-indigo-600 mt-0.5">
                    {data.regions.length > 0 ? `${data.regions[0].count} clicks (${data.regions[0].percentage}%)` : '0%'}
                  </div>
                </div>
              </div>

              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Top Distributions Summary Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Top Regions */}
                    <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-indigo-600" />
                          Top Vùng Miền & Tỉnh Thành
                        </span>
                        <span className="text-slate-400 font-normal">Tỷ lệ</span>
                      </div>
                      {data.regions.length === 0 ? (
                        <p className="text-xs text-slate-400 py-4 text-center">Chưa có dữ liệu</p>
                      ) : (
                        <div className="space-y-2">
                          {data.regions.slice(0, 5).map((r, i) => (
                            <div key={r.name} className="flex items-center justify-between text-xs">
                              <span className="text-slate-700 font-medium">#{i + 1} {r.name}</span>
                              <span className="font-bold text-slate-900">{r.count} ({r.percentage}%)</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Top Referrers */}
                    <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">
                        <span className="flex items-center gap-1.5">
                          <Share2 className="w-4 h-4 text-indigo-600" />
                          Top Kênh Nguồn Traffic
                        </span>
                        <span className="text-slate-400 font-normal">Lượt click</span>
                      </div>
                      {data.referrers.length === 0 ? (
                        <p className="text-xs text-slate-400 py-4 text-center">Chưa có dữ liệu</p>
                      ) : (
                        <div className="space-y-2">
                          {data.referrers.slice(0, 5).map((ref) => (
                            <div key={ref.name} className="flex items-center justify-between text-xs">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getChannelColor(ref.name)}`}>
                                {ref.name}
                              </span>
                              <span className="font-bold text-slate-900">{ref.count} ({ref.percentage}%)</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hourly Graph */}
                  {data.hourly_trend && data.hourly_trend.length > 0 && (
                    <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <Clock className="w-4 h-4 text-indigo-600" />
                          <span>Biểu Đồ Click Theo Khung Giờ 24H</span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px]">
                          <span className="flex items-center gap-1 text-slate-600">
                            <span className="w-2 h-2 rounded-full bg-indigo-500" /> Người dùng
                          </span>
                          <span className="flex items-center gap-1 text-slate-600">
                            <span className="w-2 h-2 rounded-full bg-amber-400" /> Bot Crawler
                          </span>
                        </div>
                      </div>

                      <div className="flex items-end justify-between gap-1 h-28 pt-4 pb-1">
                        {data.hourly_trend.map((item) => {
                          const totalBar = item.human + item.bot;
                          const maxTotal = Math.max(...data.hourly_trend.map(t => t.human + t.bot), 1);
                          const heightPercent = Math.round((totalBar / maxTotal) * 100);

                          return (
                            <div key={item.hour} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                              <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-8 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow-md z-10 whitespace-nowrap transition-opacity">
                                {item.hour}: {item.human} human, {item.bot} bot
                              </div>
                              <div className="w-full max-w-[18px] bg-slate-200 rounded-t overflow-hidden flex flex-col justify-end" style={{ height: `${Math.max(heightPercent, 5)}%` }}>
                                {item.bot > 0 && (
                                  <div className="bg-amber-400 w-full" style={{ height: `${(item.bot / Math.max(totalBar, 1)) * 100}%` }} />
                                )}
                                {item.human > 0 && (
                                  <div className="bg-indigo-500 w-full" style={{ height: `${(item.human / Math.max(totalBar, 1)) * 100}%` }} />
                                )}
                              </div>
                              <span className="text-[9px] text-slate-400 font-mono">{item.hour}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Region */}
              {activeTab === 'region' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.regions.map((reg, idx) => (
                      <div key={reg.name} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold flex items-center justify-center border border-indigo-100 shrink-0">
                              #{idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              {reg.name}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-900">
                            {reg.count} <span className="text-slate-400 font-normal">clicks</span> ({reg.percentage}%)
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.max(reg.percentage, 3)}%`,
                              backgroundColor: reg.color || '#6366f1'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Channels */}
              {activeTab === 'channel' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.referrers.map((ref) => (
                    <div key={ref.name} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getChannelColor(ref.name)}`}>
                          {ref.name}
                        </span>
                        <div className="text-xs font-bold text-slate-900">
                          {ref.count} clicks ({ref.percentage}%)
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max(ref.percentage, 3)}%`,
                            backgroundColor: ref.color || '#3b82f6'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 4: Devices */}
              {activeTab === 'device' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.devices.map((dev) => (
                      <div key={dev.name} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                        <div className="p-2 bg-white border border-slate-200 rounded-lg shadow-2xs">
                          {getDeviceIcon(dev.name)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-800">{dev.name}</span>
                            <span className="text-xs font-bold text-slate-900">{dev.count} ({dev.percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(dev.percentage, 3)}%`, backgroundColor: dev.color || '#10b981' }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Browser Breakdown */}
                  <div className="pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-indigo-500" />
                      Trình Duyệt & In-App Browser
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {data.browsers.map((b) => (
                        <div key={b.name} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-700 font-medium">{b.name}</span>
                          <span className="font-bold text-slate-900">{b.count} ({b.percentage}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Recent Visit Logs Table */}
              {activeTab === 'logs' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span>Lịch sử 30 lượt click mới nhất:</span>
                    <span>Tự động cập nhật</span>
                  </div>

                  {!data.recent_visits || data.recent_visits.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      Chưa ghi nhận lượt click nào cho link này.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-700">
                          <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                            <tr>
                              <th className="px-3 py-2.5">Thời gian</th>
                              <th className="px-3 py-2.5">Đối tượng</th>
                              <th className="px-3 py-2.5">Vị trí</th>
                              <th className="px-3 py-2.5">Thiết bị / App</th>
                              <th className="px-3 py-2.5">Nguồn (Referrer)</th>
                              <th className="px-3 py-2.5">IP</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                            {data.recent_visits.map((log) => (
                              <tr key={log.id} className="hover:bg-slate-50/80 transition">
                                <td className="px-3 py-2 whitespace-nowrap text-slate-500">
                                  {new Date(log.created_at).toLocaleString('vi-VN')}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {log.is_bot ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold font-sans">
                                      <Bot className="w-3 h-3" /> Bot
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-sans">
                                      <CheckCircle2 className="w-3 h-3" /> Người dùng
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 font-sans font-semibold text-slate-800 whitespace-nowrap">
                                  {log.country || 'TP. Hồ Chí Minh'}
                                </td>
                                <td className="px-3 py-2 font-sans text-slate-700 whitespace-nowrap">
                                  {log.device} ({log.browser})
                                </td>
                                <td className="px-3 py-2 font-sans text-slate-600 whitespace-nowrap max-w-[150px] truncate">
                                  {log.referer || 'Direct'}
                                </td>
                                <td className="px-3 py-2 text-slate-400 whitespace-nowrap">
                                  {log.ip}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Dữ liệu phân tích thời gian thực (Realtime Analytics)
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
