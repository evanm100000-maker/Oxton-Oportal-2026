const fs = require('fs');
const path = require('path');

// --- Fix Tasks.jsx ---
const tasksPath = path.join(__dirname, 'src', 'components', 'Tasks.jsx');
let tasksContent = fs.readFileSync(tasksPath, 'utf8');

if (tasksContent.includes("import { CheckSquare, Clock, Plus, Trash2, CheckCircle } from 'lucide-react';")) {
  tasksContent = tasksContent.replace(
    "import { CheckSquare, Clock, Plus, Trash2, CheckCircle } from 'lucide-react';",
    "import { CheckSquare, Clock, Plus, Trash2, CheckCircle, X } from 'lucide-react';"
  );
  fs.writeFileSync(tasksPath, tasksContent, 'utf8');
  console.log('Fixed Tasks.jsx import');
}

// --- Fix AppContext.jsx ---
const appCtxPath = path.join(__dirname, 'src', 'context', 'AppContext.jsx');
let ctxContent = fs.readFileSync(appCtxPath, 'utf8');

const oldChatWatcher = `  useEffect(() => {
    if (!currentUser) return;
    if (prevDataRef.current.chatMessages && visibleChatMessages.length > prevDataRef.current.chatMessages.length) {
      const newMsg = visibleChatMessages.find(m => !prevDataRef.current.chatMessages.some(pm => pm.id === m.id));
      if (newMsg && newMsg.senderEmail !== currentUser.email) {
        const text = newMsg.text || '';
        addNotification(\`New message from \${newMsg.senderName}\`, text.length > 40 ? text.substring(0, 40) + '...' : text, 'info');
      }
    }
    prevDataRef.current.chatMessages = visibleChatMessages;
  }, [visibleChatMessages, currentUser]);`;

const newChatWatcher = `  useEffect(() => {
    if (!currentUser) return;
    if (prevDataRef.current.chatMessages && visibleChatMessages.length > prevDataRef.current.chatMessages.length) {
      const newMsg = visibleChatMessages.find(m => !prevDataRef.current.chatMessages.some(pm => pm.id === m.id));
      if (newMsg && newMsg.senderEmail !== currentUser.email) {
        const msgTime = new Date(newMsg.timestamp).getTime();
        if (Date.now() - msgTime < 60000) {
          let shouldNotify = true;
          const pChat = privateChats && privateChats.find(c => c.id === newMsg.channel);
          if (pChat && (!pChat.participants || !pChat.participants.includes(currentUser.email))) {
            shouldNotify = false;
          }
          if (shouldNotify) {
            const text = newMsg.text || '';
            addNotification(\`New message from \${newMsg.senderName}\`, text.length > 40 ? text.substring(0, 40) + '...' : text, 'info');
          }
        }
      }
    }
    prevDataRef.current.chatMessages = visibleChatMessages;
  }, [visibleChatMessages, currentUser, privateChats]);`;

if (ctxContent.includes(oldChatWatcher)) {
  ctxContent = ctxContent.replace(oldChatWatcher, newChatWatcher);
} else if (ctxContent.includes(oldChatWatcher.replace(/\n/g, '\r\n'))) {
  ctxContent = ctxContent.replace(oldChatWatcher.replace(/\n/g, '\r\n'), newChatWatcher.replace(/\n/g, '\r\n'));
}

const oldInfWatcher = `  useEffect(() => {
    if (!currentUser) return;
    if (prevDataRef.current.infractions && infractions.length > prevDataRef.current.infractions.length) {
      const newInf = infractions.find(i => !prevDataRef.current.infractions.some(pi => pi.id === i.id));
      if (newInf && newInf.staffEmail === currentUser.email) {
        addNotification(\`New Consequence: \${newInf.type}\`, \`You received a \${newInf.type}. Check your dashboard.\`, 'danger');
      }
    }
    prevDataRef.current.infractions = infractions;
  }, [infractions, currentUser]);`;

const newInfWatcher = `  useEffect(() => {
    if (!currentUser) return;
    if (prevDataRef.current.infractions && infractions.length > prevDataRef.current.infractions.length) {
      const newInf = infractions.find(i => !prevDataRef.current.infractions.some(pi => pi.id === i.id));
      if (newInf && newInf.staffEmail === currentUser.email) {
        const msgTime = new Date(newInf.date).getTime();
        if (Date.now() - msgTime < 60000) {
          addNotification(\`New Consequence: \${newInf.type}\`, \`You received a \${newInf.type}. Check your dashboard.\`, 'danger');
        }
      }
    }
    prevDataRef.current.infractions = infractions;
  }, [infractions, currentUser]);`;

if (ctxContent.includes(oldInfWatcher)) {
  ctxContent = ctxContent.replace(oldInfWatcher, newInfWatcher);
} else if (ctxContent.includes(oldInfWatcher.replace(/\n/g, '\r\n'))) {
  ctxContent = ctxContent.replace(oldInfWatcher.replace(/\n/g, '\r\n'), newInfWatcher.replace(/\n/g, '\r\n'));
}

const oldLoaWatcher = `  useEffect(() => {
    if (!currentUser) return;
    if (prevDataRef.current.loaRequests) {
      loaRequests.forEach(loa => {
        const prevLoa = prevDataRef.current.loaRequests.find(p => p.id === loa.id);
        if (prevLoa && prevLoa.status !== loa.status && loa.userEmail === currentUser.email) {
          addNotification(\`LOA Status Updated\`, \`Your LOA request is now \${loa.status}\`, 'info');
        }
      });
    }
    prevDataRef.current.loaRequests = loaRequests;
  }, [loaRequests, currentUser]);`;

const newLoaWatcher = `  useEffect(() => {
    if (!currentUser) return;
    if (prevDataRef.current.loaRequests) {
      loaRequests.forEach(loa => {
        const prevLoa = prevDataRef.current.loaRequests.find(p => p.id === loa.id);
        if (prevLoa && prevLoa.status !== loa.status && loa.userEmail === currentUser.email) {
          // Can't easily check timestamp of status change, so we rely on length or just let it be. Wait, LOA status changes are immediate for the user who did it, but the recipient should be notified. We assume the refresh won't trigger this because prevLoa won't have a different status.
          addNotification(\`LOA Status Updated\`, \`Your LOA request is now \${loa.status}\`, 'info');
        }
      });
    }
    prevDataRef.current.loaRequests = loaRequests;
  }, [loaRequests, currentUser]);`;

if (ctxContent.includes(oldLoaWatcher)) {
  ctxContent = ctxContent.replace(oldLoaWatcher, newLoaWatcher);
} else if (ctxContent.includes(oldLoaWatcher.replace(/\n/g, '\r\n'))) {
  ctxContent = ctxContent.replace(oldLoaWatcher.replace(/\n/g, '\r\n'), newLoaWatcher.replace(/\n/g, '\r\n'));
}

const oldTicketWatcher = `  useEffect(() => {
    if (!currentUser) return;
    if (prevDataRef.current.tickets) {
      tickets.forEach(ticket => {
        const prevTicket = prevDataRef.current.tickets.find(p => p.id === ticket.id);
        if (prevTicket && ticket.comments && (!prevTicket.comments || ticket.comments.length > prevTicket.comments.length)) {
          if (ticket.authorEmail === currentUser.email || currentUser.isAdmin) {
             const newComment = ticket.comments[ticket.comments.length - 1];
             if (newComment.authorEmail !== currentUser.email) {
               addNotification(\`New Response on Support Ticket\`, newComment.text.length > 40 ? newComment.text.substring(0, 40) + '...' : newComment.text, 'info');
             }
          }
        }
      });
    }
    prevDataRef.current.tickets = tickets;
  }, [tickets, currentUser]);`;

const newTicketWatcher = `  useEffect(() => {
    if (!currentUser) return;
    if (prevDataRef.current.tickets) {
      tickets.forEach(ticket => {
        const prevTicket = prevDataRef.current.tickets.find(p => p.id === ticket.id);
        if (prevTicket && ticket.comments && (!prevTicket.comments || ticket.comments.length > prevTicket.comments.length)) {
          if (ticket.authorEmail === currentUser.email || currentUser.isAdmin) {
             const newComment = ticket.comments[ticket.comments.length - 1];
             if (newComment.authorEmail !== currentUser.email) {
               const msgTime = new Date(newComment.timestamp).getTime();
               if (Date.now() - msgTime < 60000) {
                 addNotification(\`New Response on Support Ticket\`, newComment.text.length > 40 ? newComment.text.substring(0, 40) + '...' : newComment.text, 'info');
               }
             }
          }
        }
      });
    }
    prevDataRef.current.tickets = tickets;
  }, [tickets, currentUser]);`;

if (ctxContent.includes(oldTicketWatcher)) {
  ctxContent = ctxContent.replace(oldTicketWatcher, newTicketWatcher);
} else if (ctxContent.includes(oldTicketWatcher.replace(/\n/g, '\r\n'))) {
  ctxContent = ctxContent.replace(oldTicketWatcher.replace(/\n/g, '\r\n'), newTicketWatcher.replace(/\n/g, '\r\n'));
}

const oldTaskWatcher = `  useEffect(() => {
    if (!currentUser) return;
    if (prevDataRef.current.tasks && tasks.length > prevDataRef.current.tasks.length) {
      const newTask = tasks.find(t => !prevDataRef.current.tasks.some(pt => pt.id === t.id));
      if (newTask && newTask.assignedToEmail === currentUser.email) {
        addNotification(\`New Task Assigned\`, \`You have a new task: \${newTask.title}\`, 'info');
      }
    }
    prevDataRef.current.tasks = tasks;
  }, [tasks, currentUser]);`;

const newTaskWatcher = `  useEffect(() => {
    if (!currentUser) return;
    if (prevDataRef.current.tasks && tasks.length > prevDataRef.current.tasks.length) {
      const newTask = tasks.find(t => !prevDataRef.current.tasks.some(pt => pt.id === t.id));
      if (newTask && newTask.assignedToEmail === currentUser.email) {
        const msgTime = new Date(newTask.timestamp).getTime();
        if (Date.now() - msgTime < 60000) {
          addNotification(\`New Task Assigned\`, \`You have a new task: \${newTask.title}\`, 'info');
        }
      }
    }
    prevDataRef.current.tasks = tasks;
  }, [tasks, currentUser]);`;

if (ctxContent.includes(oldTaskWatcher)) {
  ctxContent = ctxContent.replace(oldTaskWatcher, newTaskWatcher);
} else if (ctxContent.includes(oldTaskWatcher.replace(/\n/g, '\r\n'))) {
  ctxContent = ctxContent.replace(oldTaskWatcher.replace(/\n/g, '\r\n'), newTaskWatcher.replace(/\n/g, '\r\n'));
}

fs.writeFileSync(appCtxPath, ctxContent, 'utf8');
console.log('Fixed AppContext.jsx watchers');
