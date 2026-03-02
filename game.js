// 游戏主逻辑
class ChineseChessGame {
    constructor() {
        this.canvas = document.getElementById('chessBoard');
        this.ctx = this.canvas.getContext('2d');
        this.selectedPiece = null;
        this.roomId = null;
        this.isMyTurn = false;
        this.playerColor = null; // 'red' 或 'black'
        
        // 设置画布大小适配
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 棋盘网格
        this.gridSize = 60;
        this.boardSize = 8; // 8 * 8网格
        
        // 初始化棋盘
        this.initChessboard();
        this.drawBoard();
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化WebSocket连接
        this.initSocket();
    }
    
    resizeCanvas() {
        const container = document.querySelector('.game-area');
        const size = Math.min(container.clientWidth - 40, 600);
        this.canvas.width = size;
        this.canvas.height = size + 67; // 加上汉界高度
        this.gridSize = size / 8;
        this.drawBoard();
    }
    
    initChessboard() {
        // 初始化棋盘状态
        this.chessboard = Array(10).fill().map(() => Array(9).fill(null));
        
        // 初始棋子位置
        const redPieces = {
            '0,0': '車', '0,1': '馬', '0,2': '相', '0,3': '仕', '0,4': '帥',
            '0,5': '仕', '0,6': '相', '0,7': '馬', '0,8': '車',
            '2,1': '砲', '2,7': '砲',
            '3,0': '兵', '3,2': '兵', '3,4': '兵', '3,6': '兵', '3,8': '兵'
        };
        
        const blackPieces = {
            '9,0': '車', '9,1': '馬', '9,2': '象', '9,3': '士', '9,4': '將',
            '9,5': '士', '9,6': '象', '9,7': '馬', '9,8': '車',
            '7,1': '炮', '7,7': '炮',
            '6,0': '卒', '6,2': '卒', '6,4': '卒', '6,6': '卒', '6,8': '卒'
        };
        
        // 放置红方棋子
        Object.entries(redPieces).forEach(([pos, piece]) => {
            const [row, col] = pos.split(',').map(Number);
            this.chessboard[row][col] = { type: piece, color: 'red' };
        });
        
        // 放置黑方棋子
        Object.entries(blackPieces).forEach(([pos, piece]) => {
            const [row, col] = pos.split(',').map(Number);
            this.chessboard[row][col] = { type: piece, color: 'black' };
        });
    }
    
    drawBoard() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const grid = this.gridSize;
        
        // 清空画布
        ctx.clearRect(0, 0, width, height);
        
        // 绘制棋盘背景
        ctx.fillStyle = '#f9d6b8';
        ctx.fillRect(0, 0, width, height);
        
        // 绘制网格线
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        
        // 横线
        for (let i = 0; i <= 9; i++) {
            const y = i * grid;
            ctx.beginPath();
            ctx.moveTo(grid, y);
            ctx.lineTo(width - grid, y);
            ctx.stroke();
        }
        
        // 竖线
        for (let i = 0; i <= 8; i++) {
            const x = i * grid;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 4 * grid);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, 5 * grid);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        // 楚河汉界
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#8b4513';
        ctx.textAlign = 'center';
        ctx.fillText('楚 河', width / 2, 4.5 * grid);
        ctx.fillText('汉 界', width / 2, 4.7 * grid);
        
        // 绘制九宫格
        ctx.beginPath();
        ctx.moveTo(3 * grid, 0);
        ctx.lineTo(5 * grid, 2 * grid);
        ctx.moveTo(5 * grid, 0);
        ctx.lineTo(3 * grid, 2 * grid);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(3 * grid, height);
        ctx.lineTo(5 * grid, height - 2 * grid);
        ctx.moveTo(5 * grid, height);
        ctx.lineTo(3 * grid, height - 2 * grid);
        ctx.stroke();
        
        // 绘制棋子
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = this.chessboard[row][col];
                if (piece) {
                    this.drawPiece(col, row, piece.type, piece.color);
                }
            }
        }
        
        // 绘制选中效果
        if (this.selectedPiece) {
            const { col, row } = this.selectedPiece;
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.strokeRect(col * grid + 2, row * grid + 2, grid - 4, grid - 4);
        }
    }
    
    drawPiece(col, row, piece, color) {
        const ctx = this.ctx;
        const grid = this.gridSize;
        const x = col * grid + grid / 2;
        const y = row * grid + grid / 2;
        const radius = grid * 0.4;
        
        // 绘制棋子圆形背景
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        
        // 渐变色
        const gradient = ctx.createRadialGradient(x-2, y-2, 0, x, y, radius);
        if (color === 'red') {
            gradient.addColorStop(0, '#ff6b6b');
            gradient.addColorStop(1, '#c92a2a');
        } else {
            gradient.addColorStop(0, '#495057');
            gradient.addColorStop(1, '#212529');
        }
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 黑色边框
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // 绘制棋子文字
        ctx.font = `bold ${grid * 0.5}px Arial`;
        ctx.fillStyle = color === 'red' ? '#fff' : '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(piece, x, y);
    }
    
    bindEvents() {
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        document.getElementById('createRoomBtn').addEventListener('click', () => this.createRoom());
        document.getElementById('joinRoomBtn').addEventListener('click', () => this.joinRoom());
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChat();
        });
        document.getElementById('sendChatBtn').addEventListener('click', () => this.sendChat());
    }
    
    handleCanvasClick(e) {
        if (!this.roomId || !this.isMyTurn) {
            this.addChatMessage('system', '请等待对方加入或等待你的回合！');
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const col = Math.floor(x / this.gridSize);
        const row = Math.floor(y / this.gridSize);
        
        if (col < 0 || col > 8 || row < 0 || row > 9) return;
        
        const clickedPiece = this.chessboard[row][col];
        
        if (!this.selectedPiece) {
            // 第一次点击：选择棋子
            if (clickedPiece && clickedPiece.color === this.playerColor) {
                this.selectedPiece = { col, row };
                this.drawBoard();
            }
        } else {
            // 第二次点击：移动棋子
            const from = this.selectedPiece;
            const to = { col, row };
            
            // 模拟移动
            this.chessboard[row][col] = this.chessboard[from.row][from.col];
            this.chessboard[from.row][from.col] = null;
            
            this.selectedPiece = null;
            this.drawBoard();
            this.isMyTurn = false;
            
            // 更新状态
            document.getElementById('turnInfo').textContent = '对方回合';
            document.getElementById('turnInfo').style.color = '#666';
            
            this.addChatMessage('me', `移动了棋子: ${from.col},${from.row} -> ${col},${row}`);
            
            // 模拟对手响应
            setTimeout(() => this.simulateOpponentMove(), 1000);
        }
    }
    
    simulateOpponentMove() {
        if (this.isMyTurn || !this.roomId) return;
        
        // 随机移动一个黑方棋子
        const pieces = [];
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = this.chessboard[row][col];
                if (piece && piece.color === 'black') {
                    pieces.push({ col, row });
                }
            }
        }
        
        if (pieces.length > 0) {
            const from = pieces[Math.floor(Math.random() * pieces.length)];
            const directions = [
                { dr: 0, dc: 1 }, { dr: 0, dc: -1 },
                { dr: 1, dc: 0 }, { dr: -1, dc: 0 }
            ];
            
            for (let dir of directions) {
                const newRow = from.row + dir.dr;
                const newCol = from.col + dir.dc;
                
                if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 9 && 
                    (!this.chessboard[newRow][newCol] || this.chessboard[newRow][newCol].color !== 'black')) {
                    
                    this.chessboard[newRow][newCol] = this.chessboard[from.row][from.col];
                    this.chessboard[from.row][from.col] = null;
                    this.drawBoard();
                    
                    this.addChatMessage('opponent', `移动了棋子: ${from.col},${from.row} -> ${newCol},${newRow}`);
                    this.isMyTurn = true;
                    
                    document.getElementById('turnInfo').textContent = '你的回合';
                    document.getElementById('turnInfo').style.color = '#667eea';
                    
                    break;
                }
            }
        }
    }
    
    createRoom() {
        this.roomId = Math.random().toString(36).substr(2, 8).toUpperCase();
        this.playerColor = 'red';
        this.isMyTurn = true;
        
        document.getElementById('roomInfo').innerHTML = `
            🎮 房间已创建！<br>
            🔢 房间号: <strong style="color:#667eea;font-size:20px;">${this.roomId}</strong><br>
            🔗 分享此号码给好友加入<br>
            🎯 你是<strong style="color:red;">红方</strong> (先手)
        `;
        document.getElementById('myStatus').textContent = '已准备 (红方)';
        document.getElementById('turnInfo').textContent = '你的回合';
        document.getElementById('turnInfo').style.color = '#667eea';
        document.getElementById('currentTurn').textContent = '红方';
        
        this.addChatMessage('system', `房间创建成功！房间号: ${this.roomId}`);
        this.addChatMessage('system', '等待对手加入...');
        
        // 模拟对手加入
        setTimeout(() => {
            this.opponentJoined();
        }, 2000);
    }
    
    opponentJoined() {
        document.getElementById('roomInfo').innerHTML += '<div style="color:green;margin-top:5px;">✅ 对手已加入！游戏开始！</div>';
        document.getElementById('opponentStatus').textContent = '已准备 (黑方)';
        document.getElementById('gameInfo').textContent = '对局进行中...';
        
        this.addChatMessage('system', '对手已加入！红方先手。');
    }
    
    joinRoom() {
        const roomIdInput = document.getElementById('roomIdInput');
        const roomId = roomIdInput.value.trim();
        
        if (!roomId) {
            alert('请输入房间号！');
            return;
        }
        
        this.roomId = roomId;
        this.playerColor = 'black';
        this.isMyTurn = false;
        
        document.getElementById('roomInfo').innerHTML = `
            🎮 已加入房间！<br>
            🔢 房间号: <strong style="color:#667eea;">${roomId}</strong><br>
            🎯 你是<strong style="color:black;">黑方</strong> (后手)
        `;
        document.getElementById('myStatus').textContent = '已准备 (黑方)';
        document.getElementById('turnInfo').textContent = '对方回合';
        document.getElementById('turnInfo').style.color = '#666';
        document.getElementById('currentTurn').textContent = '红方';
        document.getElementById('opponentStatus').textContent = '已准备 (红方)';
        document.getElementById('gameInfo').textContent = '对局进行中...';
        
        roomIdInput.value = '';
        this.addChatMessage('system', `成功加入房间: ${roomId}`);
        this.addChatMessage('system', '红方先手，请等待...');
    }
    
    addChatMessage(sender, message) {
        const chatDiv = document.getElementById('chatMessages');
        const msgClass = sender === 'me' ? 'red-piece' : sender === 'opponent' ? 'black-piece' : '';
        
        chatDiv.innerHTML += `
            <div class="message">
                <strong class="${msgClass}">${sender === 'me' ? '我' : sender === 'opponent' ? '对手' : '系统'}:</strong> ${message}
            </div>
        `;
        chatDiv.scrollTop = chatDiv.scrollHeight;
    }
    
    sendChat() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (message && this.roomId) {
            this.addChatMessage('me', message);
            input.value = '';
            
            // 模拟对手回复
            setTimeout(() => {
                const replies = [
                    '好棋！', '等我思考一下...', '将军！', '厉害！',
                    '这步不错！', '哈哈，我要赢了！', '小心了！'
                ];
                const reply = replies[Math.floor(Math.random() * replies.length)];
                this.addChatMessage('opponent', reply);
            }, 1000);
        }
    }
    
    initSocket() {
        // 这里可以添加真实的WebSocket连接
        // 为了简化演示，这里使用本地模拟
        console.log('游戏已初始化！');
    }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
    window.game = new ChineseChessGame();
});