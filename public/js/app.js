onload = async () => {
	
	presenter.animateBlocks();
	
	EtherDrop.coinTicker(presenter.showCoinTicker, 300000);
	
	EtherDrop.init();
	
	let address = String(await EtherDrop.getUser());
	presenter.showAddress(address);
	
	if(address == "undefined" || address == '') {
		presenter.showWeb3Modal();
	} else {
		console.log(`using address: ${address}`);
		let res = await EtherDrop.userRound(address);
		let lastRound = res[0].toNumber();
		let currRound = res[1].toNumber();
		if(lastRound == currRound) {
			presenter.showActiveSubscription();
		}
	}
	
	let stat = await EtherDrop.stat();
	presenter.showStat(stat);

	let round = stat[0];
	let block = stat[4];
	
	EtherDrop.onNewRound = (round) => {
		window.location.href = '.';
	};
	
	let caches = [{},{},{}];
	let newTx = (tx, id) => { return caches[id][tx] ? false : caches[id][tx] = 1 };
	let cIndex = 0;
	EtherDrop.watchSubscriptions(round, block, async (tx, data)=> {
		console.log('got new subscription: ' + tx);
		if(newTx(tx, cIndex)){
			presenter.showRoundSubscription(tx, data);
			if(data['place'] > stat[1]) {
				stat[1]+=1;
				presenter.showStat(stat);
				presenter.coinSound();
			}
		}
	});

	EtherDrop.watchRounds((tx, data) => {
		console.log('got new round');
		if(newTx(tx, cIndex + 1)){
			console.log('got new round');
			presenter.showRoundResult(tx, data);
		}
	});
	
	if(address != '') {
		EtherDrop.watchUserSubs(address, (tx, data)=> {
			if(newTx(tx, cIndex + 2)){
				console.log('got new user subscription');
				presenter.showUserSubscription(tx, data);
			}
		});
	
		EtherDrop.watchUserRounds(address, (tx, data) => {
			if(newTx(tx, cIndex + 2)){
				console.log('got new user round');
				presenter.showUserSubscription(tx, data);
			}
		});
	}
};
