import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { Plus, FolderOpen, Clock, Users, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_COLOR = {
  open: 'badge-amber', in_progress: 'badge-blue', completed: 'badge-green',
  cancelled: 'badge-red', in_review: 'badge-slate',
};

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsAPI.my().then(r => setProjects(r.data))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading projects..." />;

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">My Projects</h1>
          <p className="text-slate-500 text-sm mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link to="/projects/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No projects yet"
          description="Post your first project to start connecting with qualified vendors."
          action={<Link to="/projects/new" className="btn-primary">Post First Project</Link>} />
      ) : (
        <div className="grid gap-4">
          {projects.map(p => (
            <Link key={p.pid} to={`/projects/${p.pid}`}
              className="card-hover flex items-center gap-5 cursor-pointer group">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors">{p.title}</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">{p.description}</p>
                  </div>
                  <span className={STATUS_COLOR[p.status] || 'badge-slate'}>{p.status?.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                  <span className="badge-slate">{p.category}</span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={11} />
                    {p.bid_count ?? 0} bids
                  </span>
                  <span className="text-amber-400 font-semibold">
                    KES {parseFloat(p.budget_min).toLocaleString()} – {parseFloat(p.budget_max).toLocaleString()}
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-600 group-hover:text-amber-400 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
