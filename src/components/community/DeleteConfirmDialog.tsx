'use client'

interface Props {
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export default function DeleteConfirmDialog({ onConfirm, onCancel, loading }: Props) {
  return (
    <div className="delete-dialog-overlay" onClick={onCancel}>
      <div className="delete-dialog" onClick={e => e.stopPropagation()}>
        <h3 className="delete-dialog-title">删除消息</h3>
        <p className="delete-dialog-text">确定要删除这条消息吗？此操作无法撤销。</p>
        <div className="delete-dialog-actions">
          <button className="delete-dialog-cancel" onClick={onCancel} disabled={loading}>
            取消
          </button>
          <button className="delete-dialog-confirm" onClick={onConfirm} disabled={loading}>
            {loading ? '删除中...' : '删除'}
          </button>
        </div>
      </div>
    </div>
  )
}
