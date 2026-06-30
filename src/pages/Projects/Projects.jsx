import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { hasPermission } from '../../constants/roles';
import { getProjects, deleteProject, createProject } from '../../services/projectService';
import { FaFolderOpen, FaPlus, FaSpinner, FaTrash } from 'react-icons/fa';
import CreateProjectModal from '../../components/CreateProjectModal/CreateProjectModal';

const Projects = () => {
  const navigate = useNavigate();
  const { userProfile, userRole } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Any authenticated user can create projects; only privileged/admin can delete
  const canCreate = !!userRole;
  const canDelete = hasPermission(userRole, 'canManageUsers') || userRole === 'privileged_user' || userRole === 'admin';

  useEffect(() => {
    fetchData();
  }, [userProfile]);

  const fetchData = async () => {
    if (!userProfile?.company) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getProjects(userProfile.company);
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (projectData) => {
    // Relying on service to add to DB, this just triggers a re-fetch or optimistically updates
    await fetchData(); // simple refetch for now
  };

  const handleDeleteProject = async (e, projectId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this project? All associated assets might be orphaned.")) {
      try {
        await deleteProject(projectId);
        setProjects(projects.filter(p => p.id !== projectId));
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full w-full bg-background">
        <FaSpinner className="animate-spin text-3xl text-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full bg-background animate-fadeIn">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-8 md:px-10 border-b border-border bg-surface shadow-sm z-10 sticky top-0 md:static">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-content-primary m-0 tracking-tight flex items-center gap-3">
            Project Workspaces
          </h1>
          <p className="text-sm text-content-secondary font-medium mt-1 mb-0">Organize your testimonials into different campaigns or projects for <span className="font-semibold text-primary-600">{userProfile?.company}</span>. Start by creating a project.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          {canCreate && (
            <button 
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2.5 font-semibold transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 border-none"
              onClick={() => setIsModalOpen(true)}
            >
              <FaPlus size={14} /> New Project
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-surface border border-border border-dashed rounded-2xl shadow-sm">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-6 shadow-inner text-primary-500">
              <FaFolderOpen className="text-3xl" />
            </div>
            <h3 className="text-xl font-bold text-content-primary mb-2">No Projects Yet</h3>
            <p className="text-content-secondary max-w-md mx-auto mb-8 font-medium">
              Create a project to start organizing your files, case studies, and assigning testimonials.
            </p>
            {canCreate && (
              <button 
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-2.5 font-semibold transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 border-none"
                onClick={() => setIsModalOpen(true)}
              >
                <FaPlus size={14} /> Create First Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fadeIn">
            {projects.map(project => (
              <div 
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="bg-surface rounded-2xl shadow-sm border border-border p-6 hover:shadow-md hover:border-primary-300 transition-all duration-200 cursor-pointer flex flex-col group h-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    <FaFolderOpen className="text-xl" />
                  </div>
                  {canDelete && (
                    <button
                      onClick={(e) => handleDeleteProject(e, project.id)}
                      className="p-2 text-content-muted hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Delete Project"
                    >
                      <FaTrash size={14} />
                    </button>
                  )}
                </div>
                
                <h3 className="font-heading text-lg font-bold text-content-primary mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors">
                  {project.name}
                </h3>
                
                <p className="text-sm text-content-secondary line-clamp-2 mb-4 flex-grow font-medium leading-relaxed">
                  {project.description || 'No description provided.'}
                </p>
                
                <div className="flex items-center justify-between text-xs font-semibold text-content-muted border-t border-border pt-4 mt-auto">
                  <span>Created {project.createdAt?.toDate().toLocaleDateString() || 'Recently'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <CreateProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={async (data) => {
          await createProject({ ...data, companyId: userProfile?.company });
          await fetchData();
          setIsModalOpen(false);
        }}
      />
    </div>
  );
};

export default Projects;
