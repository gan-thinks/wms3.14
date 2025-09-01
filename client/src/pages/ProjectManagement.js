import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Plus, 
  Upload, 
  MessageSquare, 
  UserPlus, 
  Edit,
  Calendar,
  Clock
} from 'lucide-react';

const ProjectManagement = ({ project, onUpdate }) => {
  const [employees, setEmployees] = useState([]);
  const [newMember, setNewMember] = useState('');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'Medium',
    estimatedHours: '',
    dueDate: ''
  });
  const [newRemark, setNewRemark] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleAddMember = async () => {
    if (!newMember) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/projects/${project._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          members: [...project.members.map(m => m._id), newMember]
        })
      });
      
      if (response.ok) {
        onUpdate();
        setNewMember('');
      }
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/projects/${project._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tasks: [...project.tasks, {
            ...newTask,
            estimatedHours: parseFloat(newTask.estimatedHours) || 0,
            status: 'Not Started',
            progress: 0
          }]
        })
      });
      
      if (response.ok) {
        onUpdate();
        setNewTask({
          title: '',
          description: '',
          assignedTo: '',
          priority: 'Medium',
          estimatedHours: '',
          dueDate: ''
        });
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleAddRemark = async () => {
    if (!newRemark) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/projects/${project._id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          remarks: newRemark
        })
      });
      
      if (response.ok) {
        onUpdate();
        setNewRemark('');
      }
    } catch (error) {
      console.error('Error adding remark:', error);
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    // In a real implementation, you'd upload these to your server
    setUploadedFiles(prev => [...prev, ...files]);
  };

  return (
    <div className="space-y-6">
      {/* Add Member Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Select an employee to add to this project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={newMember} onValueChange={setNewMember}>
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees
                  .filter(emp => !project.members.some(m => m._id === emp._id))
                  .map(employee => (
                    <SelectItem key={employee._id} value={employee._id}>
                      {employee.firstName} {employee.lastName} - {employee.department}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddMember} className="w-full">
              Add Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Task title"
              value={newTask.title}
              onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
            />
            <Textarea
              placeholder="Task description"
              value={newTask.description}
              onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
            />
            <Select 
              value={newTask.assignedTo} 
              onValueChange={(value) => setNewTask(prev => ({ ...prev, assignedTo: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Assign to" />
              </SelectTrigger>
              <SelectContent>
                {project.members.map(member => (
                  <SelectItem key={member._id} value={member._id}>
                    {member.firstName} {member.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={newTask.priority} 
              onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Estimated hours"
                value={newTask.estimatedHours}
                onChange={(e) => setNewTask(prev => ({ ...prev, estimatedHours: e.target.value }))}
              />
              <Input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
            <Button onClick={handleAddTask} className="w-full">
              Add Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Remark Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">
            <MessageSquare className="h-4 w-4 mr-2" />
            Add Remark
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Project Remark</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your remark or update..."
              value={newRemark}
              onChange={(e) => setNewRemark(e.target.value)}
              rows={4}
            />
            <Button onClick={handleAddRemark} className="w-full">
              Add Remark
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Upload */}
      <div className="flex items-center gap-2">
        <input
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button variant="outline" asChild>
            <span>
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </span>
          </Button>
        </label>
        {uploadedFiles.length > 0 && (
          <Badge variant="secondary">
            {uploadedFiles.length} file(s) uploaded
          </Badge>
        )}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {project.progressUpdates?.slice(0, 5).map((update, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border-l-4 border-blue-200 bg-gray-50 rounded">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {update.updatedBy?.firstName?.[0]}{update.updatedBy?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {update.updatedBy?.firstName} {update.updatedBy?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(update.date).toLocaleDateString()}
                  </p>
                  {update.remarks && (
                    <p className="text-sm mt-1">{update.remarks}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectManagement;
