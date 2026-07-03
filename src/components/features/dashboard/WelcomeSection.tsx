import React from "react";

interface WelcomeSectionProps {
  displayName: string;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
};

export function WelcomeSection({ displayName }: WelcomeSectionProps) {
  return (
    <div className="space-y-1.5 py-1">
      <h2 className="text-xl md:text-2xl font-bold tracking-tight">
        {getGreeting()}, <span className="text-primary">{displayName}</span>! 👋
      </h2>
      <p className="text-xs md:text-sm text-muted-foreground italic leading-relaxed">
        &ldquo;Học một ngoại ngữ mới không chỉ là học những từ khác nhau cho cùng một thứ, mà là học một cách nghĩ khác về mọi thứ.&rdquo;
      </p>
    </div>
  );
}
