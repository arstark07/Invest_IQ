"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Target, 
  Plus, 
  Calendar, 
  Home,
  GraduationCap,
  Plane,
  Car,
  Heart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { getSavingsGoals, createSavingsGoal, updateSavingsGoal } from "@/actions/dashboard-widgets";

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

const categoryIcons = {
  Emergency: ShieldCheck,
  Vacation: Plane,
  Home: Home,
  Education: GraduationCap,
  Car: Car,
  Wedding: Heart,
  Other: Target,
};

const categoryColors = {
  Emergency: "bg-red-100 dark:bg-red-900 text-red-600",
  Vacation: "bg-cyan-100 dark:bg-cyan-900 text-cyan-600",
  Home: "bg-amber-100 dark:bg-amber-900 text-amber-600",
  Education: "bg-purple-100 dark:bg-purple-900 text-purple-600",
  Car: "bg-blue-100 dark:bg-blue-900 text-blue-600",
  Wedding: "bg-pink-100 dark:bg-pink-900 text-pink-600",
  Other: "bg-gray-100 dark:bg-gray-900 text-gray-600",
};

export function SavingsGoals() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [addMoneyDialogOpen, setAddMoneyDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    deadline: "",
    category: "Other",
  });
  const [addAmount, setAddAmount] = useState("");

  const fetchData = async () => {
    const result = await getSavingsGoals();
    if (result.success) {
      setData(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateGoal = async () => {
    if (!formData.name || !formData.targetAmount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const result = await createSavingsGoal({
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      deadline: formData.deadline || null,
      category: formData.category,
    });

    if (result.success) {
      toast.success("Savings goal created!");
      setCreateDialogOpen(false);
      setFormData({ name: "", targetAmount: "", deadline: "", category: "Other" });
      fetchData();
    } else {
      toast.error(result.error || "Failed to create goal");
    }
  };

  const handleAddMoney = async () => {
    if (!addAmount || !selectedGoal) return;

    const result = await updateSavingsGoal(selectedGoal.id, {
      amount: parseFloat(addAmount),
      action: "add",
    });

    if (result.success) {
      toast.success(`Added ${formatCurrency(parseFloat(addAmount))} to goal!`);
      setAddMoneyDialogOpen(false);
      setAddAmount("");
      setSelectedGoal(null);
      fetchData();
    } else {
      toast.error(result.error || "Failed to add money");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Savings Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-500" />
            Savings Goals
          </CardTitle>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Savings Goal</DialogTitle>
                <DialogDescription>Set a new financial goal to work towards</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">Goal Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Emergency Fund"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Target Amount (₹)</label>
                  <Input
                    type="number"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    placeholder="100000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.keys(categoryIcons).map((cat) => (
                      <Button
                        key={cat}
                        type="button"
                        size="sm"
                        variant={formData.category === cat ? "default" : "outline"}
                        onClick={() => setFormData({ ...formData, category: cat })}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Target Date (Optional)</label>
                  <Input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateGoal}>Create Goal</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        {data && (
          <CardDescription>
            {formatCurrency(data.totalSaved)} saved of {formatCurrency(data.totalTarget)} total
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!data || data.goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">No savings goals yet</p>
            <p className="text-xs text-muted-foreground">Create your first goal to start saving!</p>
          </div>
        ) : (
          <>
            {data.goals.slice(0, 4).map((goal) => {
              const Icon = categoryIcons[goal.category] || Target;
              const colorClass = categoryColors[goal.category] || categoryColors.Other;
              const isCompleted = goal.status === "COMPLETED";

              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{goal.name}</p>
                        {goal.deadline && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(goal.deadline).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    {isCompleted ? (
                      <Badge className="bg-green-100 text-green-700">Completed</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedGoal(goal);
                          setAddMoneyDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Progress value={Math.min(100, goal.progress)} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(goal.currentAmount)}</span>
                    <span>{goal.progress.toFixed(1)}%</span>
                    <span>{formatCurrency(goal.targetAmount)}</span>
                  </div>
                </div>
              );
            })}

            {data.goals.length > 4 && (
              <p className="text-center text-sm text-muted-foreground">
                +{data.goals.length - 4} more goals
              </p>
            )}
          </>
        )}

        {/* Add Money Dialog */}
        <Dialog open={addMoneyDialogOpen} onOpenChange={setAddMoneyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to {selectedGoal?.name}</DialogTitle>
              <DialogDescription>
                Current: {formatCurrency(selectedGoal?.currentAmount || 0)} / {formatCurrency(selectedGoal?.targetAmount || 0)}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium">Amount (₹)</label>
              <Input
                type="number"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="1000"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddMoneyDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMoney}>Add Money</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
