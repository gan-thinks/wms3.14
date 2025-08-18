import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ProjectDetails = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);

  useEffect(() => {
    axios.get(`/api/projects/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(res => setProject(res.data));
  }, [id]);

  if (!project) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold">{project.name}</h1>
      <p>{project.description}</p>

      <h2 className="mt-4 font-semibold">Members</h2>
      <ul>
        {project.members.map(m => (
          <li key={m._id}>{m.firstName} {m.lastName}</li>
        ))}
      </ul>

      <h2 className="mt-4 font-semibold">Progress Over Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={project.progressUpdates}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString()} />
          <YAxis domain={[0, 100]} />
          <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString()} />
          <Line type="monotone" dataKey="progress" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProjectDetails;
