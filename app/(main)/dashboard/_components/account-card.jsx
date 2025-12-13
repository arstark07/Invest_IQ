"use client";

import { ArrowUpRight, ArrowDownRight, CreditCard, Star, TrendingUp, Eye } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useFetch from "@/hooks/use-fetch";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateDefaultAccount } from "@/actions/account";
import { toast } from "sonner";

// Animated counter component
function AnimatedBalance({ value }) {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const target = parseFloat(value);
    const duration = 1000;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplayValue(target);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span>₹ {displayValue.toFixed(2)}</span>;
}

export function AccountCard({ account, isSelected = false, onSelect }) {
  const { name, type, balance, id, isDefault } = account;
  const router = useRouter();

  const {
    loading: updateDefaultLoading,
    fn: updateDefaultFn,
    data: updatedAccount,
    error,
  } = useFetch(updateDefaultAccount);

  const handleDefaultChange = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (isDefault) {
      toast.warning("You need atleast 1 default account");
      return;
    }

    await updateDefaultFn(id);
  };

  // Handle click to select account for dashboard view
  const handleCardClick = (e) => {
    // Don't trigger on switch click
    if (e.target.closest('[role="switch"]')) return;
    
    if (onSelect) {
      onSelect(id);
      toast.success(`Viewing ${name} data`, { duration: 2000 });
    }
  };

  // Double click to navigate to account page
  const handleDoubleClick = (e) => {
    if (e.target.closest('[role="switch"]')) return;
    router.push(`/account/${id}`);
  };

  useEffect(() => {
    if (updatedAccount?.success) {
      toast.success("Default account updated successfully");
    }
  }, [updatedAccount]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update default account");
    }
  }, [error]);

  // Determine gradient based on account type
  const typeGradients = {
    CURRENT: "from-blue-500/10 to-cyan-500/10",
    SAVINGS: "from-green-500/10 to-emerald-500/10",
  };

  const typeColors = {
    CURRENT: "text-blue-500",
    SAVINGS: "text-green-500",
  };

  return (
    <Card 
      className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 cursor-pointer ${isSelected ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20' : ''} ${isDefault ? 'border-purple-500/50' : ''}`}
      onClick={handleCardClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-2 right-2 z-10">
          <Badge className="bg-blue-500 text-white text-[10px] px-1.5">
            <Eye className="w-3 h-3 mr-0.5" />
            Viewing
          </Badge>
        </div>
      )}
      
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${typeGradients[type] || 'from-gray-500/10 to-gray-500/10'} ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`} />
      
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${typeGradients[type] || 'from-gray-500/20 to-gray-500/20'}`}>
            <CreditCard className={`w-4 h-4 ${typeColors[type] || 'text-gray-500'}`} />
          </div>
          <CardTitle className="text-sm font-medium capitalize">
            {name}
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {isDefault && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-[10px] px-1.5">
              <Star className="w-3 h-3 mr-0.5" />
              Default
            </Badge>
          )}
          <Switch
            checked={isDefault}
            onClick={handleDefaultChange}
            disabled={updateDefaultLoading}
            className="data-[state=checked]:bg-purple-500"
          />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-3xl font-bold tracking-tight">
          <AnimatedBalance value={balance} />
        </div>
        <div className="flex items-center gap-1 mt-1">
          <Badge variant="outline" className={`text-[10px] ${typeColors[type]} border-current/30`}>
            {type.charAt(0) + type.slice(1).toLowerCase()}
          </Badge>
          <TrendingUp className="w-3 h-3 text-green-500 animate-bounce-subtle" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between text-sm text-muted-foreground relative border-t pt-4">
        <div className="flex items-center gap-1 group/income hover:text-green-500 transition-colors">
          <div className="p-1 rounded-full bg-green-500/10 group-hover/income:bg-green-500/20 transition-colors">
            <ArrowUpRight className="h-3 w-3 text-green-500" />
          </div>
          <span className="text-xs">Income</span>
        </div>
        <div className="flex items-center gap-1 group/expense hover:text-red-500 transition-colors">
          <div className="p-1 rounded-full bg-red-500/10 group-hover/expense:bg-red-500/20 transition-colors">
            <ArrowDownRight className="h-3 w-3 text-red-500" />
          </div>
          <span className="text-xs">Expense</span>
        </div>
      </CardFooter>
      
      {/* Click hint */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
        Click to view • Double-click for details
      </div>
    </Card>
  );
}
