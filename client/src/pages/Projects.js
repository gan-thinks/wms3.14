// src/pages/Projects.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('/api/projects', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setProjects(res.data))
      .catch(err => {
        console.error('Error fetching projects', err.response?.data || err);
        setProjects([]);
      });
  }, []);

  const userId = JSON.parse(localStorage.getItem('user') || 'null')?._id;

  const filtered = projects.filter(p => {
    if (filter === 'created') return p.createdBy && p.createdBy._id === userId;
    if (filter === 'assigned') return p.members && p.members.some(m => m._id === userId);
    if (filter === 'completed') return p.status === 'Completed' || p.status === 'completed';
    return true;
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Projects</h1>

      <div className="mb-4 space-x-3">
        <button onClick={() => setFilter('all')} className={`px-3 py-1 ${filter==='all' ? 'bg-gray-200' : ''}`}>All</button>
        <button onClick={() => setFilter('created')} className={`px-3 py-1 ${filter==='created' ? 'bg-gray-200' : ''}`}>Created by Me</button>
        <button onClick={() => setFilter('assigned')} className={`px-3 py-1 ${filter==='assigned' ? 'bg-gray-200' : ''}`}>Assigned to Me</button>
        <button onClick={() => setFilter('completed')} className={`px-3 py-1 ${filter==='completed' ? 'bg-gray-200' : ''}`}>Completed</button>
      </div>

      {filtered.length === 0 ? (
        <p>No projects found for this filter.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(proj => (
            <div key={proj._id} className="border rounded p-4 bg-white">
              <Link to={`/projects/${proj._id}`} className="no-underline text-inherit">
                <h2 className="text-lg font-bold">{proj.name}</h2>
              </Link>
              <p className="text-sm text-gray-600">By: {proj.createdBy?.firstName} {proj.createdBy?.lastName}</p>
              <p className="mt-2">{proj.description}</p>
              <p className="mt-2 font-medium">Status: {proj.status}</p>
              <div className="mt-3">
                <strong>Tasks:</strong>
                <ul className="list-disc ml-5">
                  {(proj.tasks || []).map((t, i) => (
                    <li key={i}>
                      {t.title} — {t.assignedTo ? `${t.assignedTo.firstName || ''} ${t.assignedTo.lastName || ''}` : 'Unassigned'} ({t.status})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
