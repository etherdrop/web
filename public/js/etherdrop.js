/*
 * EtherDrop contract client
 */
const EtherDrop = {
	
	abi : [{"anonymous": false,"inputs": [{"indexed": true,"name": "previousOwner","type": "address"},{"indexed": true,"name": "newOwner","type": "address"}],"name": "OwnershipTransferred","type": "event"},{"constant": false,"inputs": [],"name": "pause","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"constant": false,"inputs": [],"name": "support","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"anonymous": false,"inputs": [],"name": "Pause","type": "event"},{"constant": false,"inputs": [{"name": "newOwner","type": "address"}],"name": "transferOwnership","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"anonymous": false,"inputs": [{"indexed": true,"name": "addr","type": "address"},{"indexed": true,"name": "round","type": "uint256"},{"indexed": false,"name": "place","type": "uint256"},{"indexed": false,"name": "price","type": "uint256"}],"name": "NewDropOut","type": "event"},{"anonymous": false,"inputs": [{"indexed": true,"name": "addr","type": "address"},{"indexed": true,"name": "round","type": "uint256"},{"indexed": false,"name": "place","type": "uint256"}],"name": "NewSubscriber","type": "event"},{"anonymous": false,"inputs": [],"name": "Unpause","type": "event"},{"constant": false,"inputs": [],"name": "unpause","outputs": [],"payable": false,"stateMutability": "nonpayable","type": "function"},{"payable": true,"stateMutability": "payable","type": "fallback"},{"inputs": [],"payable": false,"stateMutability": "nonpayable","type": "constructor"},{"constant": true,"inputs": [],"name": "owner","outputs": [{"name": "","type": "address"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": true,"inputs": [],"name": "paused","outputs": [{"name": "","type": "bool"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": true,"inputs": [],"name": "stat","outputs": [{"name": "round","type": "uint256"},{"name": "position","type": "uint256"},{"name": "max","type": "uint256"},{"name": "price","type": "uint256"},{"name": "blok","type": "uint256"}],"payable": false,"stateMutability": "view","type": "function"},{"constant": true,"inputs": [{"name": "user","type": "address"}],"name": "userRound","outputs": [{"name": "lastRound","type": "uint256"},{"name": "currentRound","type": "uint256"}],"payable": false,"stateMutability": "view","type": "function"}],

	address : '0x5c444784f4f0354e16fc2382864bf12977bf848e',
	
	infura : 'https://ropsten.infura.io/plnAtKGtcoxBtY9UpS4b',
	
	init : () => {
		
		if (typeof web3 !== 'undefined') {
			console.log('using detected provider web3');
			web3 = new Web3(web3.currentProvider);
			
			web3.eth.getAccounts((e, accounts)=> {
				if(accounts && accounts.length == 0) {
					web3.currentProvider.enable().then(()=> window.location.href = '.');
				}
			});
		} else {
			console.log('using http provider web3');
			web3 = new Web3(new Web3.providers.HttpProvider(EtherDrop.provider));
		}
		
		EtherDrop.instance = web3.eth.contract(EtherDrop.abi).at(EtherDrop.address);
	},
	
	watchers: [],
	
	coinTicker: (callback, timer) =>  { 
		let cmUrl = "https://api.coinmarketcap.com/v2/ticker/?start=0&limit=20&sort=rank&structure=array";
		let apiCall = ()=> {
			$.ajax({
				type: "GET",
				url: cmUrl,
				success: (data) => { 
					callback(data['data']); 
				}
			});
		};
		apiCall();
		setInterval(apiCall, timer);
	},

	getUser: async () => {
		return new Promise((resolve, reject) => { 
			web3.eth.getAccounts((e, d)=> resolve(d));
		});
	},
	
	transact: async (address) => {
		return new Promise((resolve, reject) => {
			let params = { from: address, value: EtherDrop.price };
			let resolution = (err, res) => {
				if (err) {
					reject(err);
				} else {
					resolve(web3.eth.sendTransaction({to:EtherDrop.address, from:address}));
				}
			};
			web3.eth.sendTransaction({from: address, to:EtherDrop.address, value: EtherDrop.price}, function(e) {
				console.log(e);
			});
		});
	},
	
	stat: async function() {
		return new Promise((resolve, reject) => {
			EtherDrop.instance.stat((e, r) => {			
				//[round, position, max, price, block]
				EtherDrop.round = r[0];
				EtherDrop.position = r[1];
				EtherDrop.max = r[2];
				EtherDrop.price = r[3];
				EtherDrop.block = r[4];
				resolve(r);
			});
		});
	},
	
	userRound: async (user) => {
		return new Promise((resolve, reject) => { 
			EtherDrop.instance.userRound(user, (e,d)=> {
				if(e) console.log(e);
				EtherDrop.userRound = d[1];
				resolve(d);
			})
		});
	},
	
	watchSubscriptions: (round, fromBlock, callback) => {
		console.log(`watching round ${round} from block ${fromBlock}`);
		EtherDrop.instance
			.NewSubscriber({round: 1}, { fromBlock:  0, toBlock: 'latest'})
			.watch((error, event) => {
				if (error) {
					console.log(`error while searching round subscriptions: ${error}`);
				} else {
					// args: [address indexed addr, indexed round, place]
					callback(event['transactionHash'], event['args']);
				}
		});
	},
	
	watchRounds: (callback, fromBlock) => {
		console.log('watching round results');
		EtherDrop.instance
			.NewDropOut({ }, { fromBlock: fromBlock || 0, toBlock: 'latest'})
			.watch((error, event) =>  {
				if (error) {
					console.log(`error while searching subscriptions: ${error}`);
				} else {
					// args [address indexed addr, indexed round, place, price]
					// check new round
					if(event['args']['round'] > EtherDrop.round) {
						if(EtherDrop.onNewRound) {
							EtherDrop.onNewRound(event['args']['round']);
						}
					}
					callback(event['transactionHash'], event['args'])
				}
			});
	},
	
	watchUserSubs: (user, callback) => {
		console.log(`watching user subscriptions ${user}`);
		EtherDrop.instance
			.NewSubscriber({addr: user}, { fromBlock: 0, toBlock: 'latest'})
			.watch((error, event) => {
				if (error) {
					console.log(`error while searching round subscriptions: ${error}`);
				} else {
					// args: [address indexed addr, indexed round, place]
					let args = event['args'];
					let round = args['round'];
					let res = round.toNumber() == EtherDrop.round.toNumber() ? 'pending' : '-';
					event['args']['status'] = res;
					callback(event['transactionHash'], event['args']);
				}
			});
	},
	
	watchUserRounds: (user, callback) => {
		console.log(`watching user rounds ${user}`);
		EtherDrop.instance
			.NewDropOut({addr: user}, { fromBlock: 0, toBlock: 'latest'})
			.watch((error, event) => {
				if (error) {
					console.log(`error while searching round subscriptions: ${error}`);
				} else {
					// args [address indexed addr, indexed round, place, price]
					callback(event['transactionHash'], event['args']);
				}
			});
	}
};