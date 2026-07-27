"use client";

type ActionToolbarProps = {
  isStarred: boolean;
  isArchived: boolean;
  disabled?: boolean;
  onArchive: () => void;
  onTrash: () => void;
  onStar: () => void;
  onMarkUnread: () => void;
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
  onBack?: () => void;
};

function ToolbarButton({
  label,
  onClick,
  disabled,
  active,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`motion-press inline-flex min-h-10 shrink-0 items-center rounded-md px-3 py-2 text-xs font-medium transition disabled:opacity-40 ${
        active
          ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
          : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
      }`}
    >
      {label}
    </button>
  );
}

export function ActionToolbar({
  isStarred,
  isArchived,
  disabled,
  onArchive,
  onTrash,
  onStar,
  onMarkUnread,
  onReply,
  onReplyAll,
  onForward,
  onBack,
}: ActionToolbarProps) {
  return (
    <div className="motion-fade-in flex items-stretch border-b border-zinc-200 dark:border-zinc-800">
      {onBack ? (
        <div className="flex shrink-0 items-center border-r border-zinc-200 px-1 lg:hidden dark:border-zinc-800">
          <ToolbarButton label="← Back" onClick={onBack} disabled={disabled} />
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto overscroll-x-contain px-2 py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ToolbarButton
          label={isArchived ? "Move to inbox" : "Archive"}
          onClick={onArchive}
          disabled={disabled}
        />
        <ToolbarButton label="Trash" onClick={onTrash} disabled={disabled} />
        <ToolbarButton
          label={isStarred ? "★ Starred" : "☆ Star"}
          onClick={onStar}
          disabled={disabled}
          active={isStarred}
        />
        <ToolbarButton
          label="Mark unread"
          onClick={onMarkUnread}
          disabled={disabled}
        />
        <div className="mx-1 hidden h-4 w-px shrink-0 bg-zinc-200 sm:block dark:bg-zinc-800" />
        <ToolbarButton label="Reply" onClick={onReply} disabled={disabled} />
        <ToolbarButton
          label="Reply all"
          onClick={onReplyAll}
          disabled={disabled}
        />
        <ToolbarButton label="Forward" onClick={onForward} disabled={disabled} />
      </div>
    </div>
  );
}
