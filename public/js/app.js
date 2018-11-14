onload = async () => {
	
	presenter.animateBlocks();
	
	EtherDrop.coinTicker(presenter.showCoinTicker, 300000);
	
	EtherDrop.init();
	
	let app = {};
	
	let fetchRound = async () => {
		let stat = await EtherDrop.stat();
		//[round, position, max, price, block, lock]
		app.round = stat[0].toNumber();
		app.position = stat[1].toNumber();
		app.max = stat[2].toNumber();
		app.price = stat[3].toNumber();
		app.block = stat[4].toNumber();
		app.lock = stat[5].toNumber();
		presenter.showStat(stat);
	};
	
	await fetchRound();
	
	if(app.position == app.max) {
		presenter.toast('<b>Drop No. ' + app.round + ' Full<br>Price on next Round Starts</b>');		
	} else {
		presenter.toast('<b>Drop No. ' + app.round + '</b>');		
	}
	
	
	let address = String(await EtherDrop.getUser());
	presenter.showAddress(address);
	
	if(address == "undefined" || address == '') {
		presenter.showWeb3Modal();
	} else {
		console.log(`using address: ${address}`);
		app.address = address;
		let res = await EtherDrop.userRound(address);
		let lastRound = res[0].toNumber();
		let currRound = res[1].toNumber();
		if(lastRound == currRound && app.position < app.max) {
			presenter.showActiveSubscription();
		} else {
			presenter.bindSubscription(async ()=> {
				let txHash = await EtherDrop.transact(app.address, app.price);
				if(txHash) {
					presenter.showWaitSubscription();
					let checkTx = () => {
						web3.eth.getTransactionReceipt(txHash, (e, r) => {
							if(r) {
								if(r.status == "0x1") {
									presenter.toast("Successfully Subscribed!");
									presenter.showActiveSubscription();
								} else if (r.status == "0x0") {
									presenter.toast(`Subscription Failed! <a class='btn btn-primary' onclick='window.location="."'>Reload</a>`, 5000);
								}
							} else {
								setTimeout(checkTx, 2000);
							}
						});
					};
					checkTx();
				} else {
					presenter.toast("Subscription Aborted!");
				}
			});
		}
	}

	let caches = [{},{},{}];
	let newTx = (tx, id) => { return caches[id][tx] ? false : caches[id][tx] = 1 };
	let cIndex = 0;
	
	EtherDrop.watchSubscriptions(app.round, app.block, async (tx, data)=> {
		if(newTx(tx, cIndex)){
			let round = data['round'].toNumber();
			let position = data['place'].toNumber();
			if(app.round < round) {
				window.location.href = '.';
			} else if(app.round == round && app.position < position) {
				presenter.coinSound();
				await fetchRound();
			}			
			presenter.showRoundSubscription(tx, data);
		}
	});

	EtherDrop.watchRounds((tx, data) => {
		if(newTx(tx, cIndex + 1)){
			let round = data['round'].toNumber();
			console.log('app.round ' + app.round + ' , event round: ' + round);
			if(round >= app.round) {
				window.location = '.';
			} else {
				presenter.showRoundResult(tx, data);
			}
		}
	});
	
	if(app.address) {	
		EtherDrop.watchUserSubs(app.address, (tx, data)=> {
			if(newTx(tx, cIndex + 2)){
				presenter.showUserSubscription(tx, data, app.round);
			}
		});
		EtherDrop.watchUserRounds(app.address, (tx, data) => {
			if(newTx(tx, cIndex + 2)){
				presenter.showUserSubscription(tx, data);
			}
		});
	}
};
