/*
 * selector shortcut
 */
const $$ = (id) => {
    return document.getElementById(id);
};

/*
 * prototype
 */
const lpad = function(s, size) {
  s = String(s);
  while (s.length < (size || 2)) {s = "0" + s;}
  return s;
}

/*
 * UI only - presenter
 */
const presenter = {

    toast: (msg, timeout) => {
        
		let tst = $$('snackbar');
        
		tst.className = "show";
        tst.innerHTML = msg;
        
		if(presenter.toastIndex) {
			presenter.toastIndex++;
		} else {
			presenter.toastIndex = 1;
		}
		
		if(!timeout) {
			timeout = 2500;
		}
		
        setTimeout(() => {
            if (--presenter.toastIndex === 0)  {
				tst.className = tst.className.replace("show", "");
			}
        }, timeout);
    },
	
	coinSound: () => {
        document.getElementById("coin-sound").play();
    },
	
	showWeb3Modal: () => { 
		$('#web3Modal').modal({backdrop: 'static'});	
	},
		
	animateBlocks: () => {
		
		$('[data-toggle="tooltip"]').tooltip()
		
        let bx = 0;
        let bHash = $('#block_hash');
        
		let blockHashText = [
            '<i class="fa fa-fw fa-square"></i>',
            '<i class="fa fa-fw fa-ellipsis-h" ></i>',
            '<i class="fa fa-fw fa-square" ></i>',
            '<i class="fa fa-fw fa-ellipsis-h" ></i>',
            '<i class="fa fa-fw fa-square" ></i>',
            '<i class="fa fa-fw fa-ellipsis-h" ></i>',
            '<i class="fa fa-fw fa-tint" ></i>'
        ];

        let animateBlocks = () => {
            let e = $(blockHashText[bx++]);
			
            e.hide();
            bHash.append(e);
            e.fadeIn(250);
            if (bx === blockHashText.length + 1) {
                bHash.html(blockHashText[0]);
                bx = 1;
            }
            setTimeout(animateBlocks, 500);
        };

        animateBlocks();
    },
	
	showCoinTicker: (items) => {
		var coins = $('#price-ticker').empty();
		items.forEach(coin => 
			coins.append(`<span><small><b>${coin.symbol} ${coin.quotes.USD.price.toFixed(2)}</b></small></span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`)
		);
		$('.marquee').marquee();
	},
	
	showAddress: (address) => {		
		if(address == '') {
			$('#wallet-address').html("<small><i>Not Found</i></small>");
		} else {
			let addr = address + '';
			addr = addr.substring(0,6) + " . . . " + addr.substring(36);
			let link = `<a target="_blank" href=https://ropsten.etherscan.io/address/${address}><b>${addr}</b></a>`;
			$('#wallet-address').html(link);	
		}
		
		// smart contract address
		$('.smart-contract').attr('href', `https://etherscan.io/address/${EtherDrop.address}#code`);
		
		// qr-code
		new QRCode("qrcode", {width: 128, height: 128}).makeCode(EtherDrop.address);
		$('#contract-address').val(EtherDrop.address);
		setTimeout(()=> { $("#qrcode > img").click(presenter.copyBarcode) }, 1000 );
	},
	
	copyBarcode: () => {
        var text_val = document.getElementById("contract-address");
		text_val.focus();
        text_val.select();
		document.execCommand("copy");
		presenter.toast('Address Copied');
	},
	
	showActiveSubscription : () => {
		$("#btn-transact")
			.addClass("text-white bg-warning")
			.html('<b>Subscribed In Current Round</b> <i class="fas fa-spin fa-asterisk"></i>')
			.click((e)=> {
				e.preventDefault();
				presenter.toast("Please Wait Until Next Round");
		});
	},
	
	bindSubscription: (callback) => {
		$("#btn-transact").click(()=> { 
			callback();
		});
	},
	
	showWaitSubscription: ()=> {
		$("#btn-transact")
		.addClass("text-white bg-info")
		.html('<b>Transaction Pending</b> <i class="fas fa-spin fa-asterisk"></i>')
		.off('click');
	},
		
	showStat: (stat) => {
		//[round, position, max, price, block, lock]
		EtherDrop.block = stat[4];
		$('#round-progress').html(`${stat[1]} / ${stat[2]}`);
		$('#round-number').html(`<b>${stat[0]}</b>`);
		$('#round-profit').html(`<b>x${stat[2]*90/100}</b>`);
		$('.round-jackpot').html(`<b>${(stat[2]*stat[3]*90/10**20).toFixed(1)} ETH</b>`);
		$('#round-price').html(`${stat[3]/10**18}`);
		let progress = 150 * (stat[2] - stat[1]) / stat[2];
		$.keyframe.define([{
            name: 'fillAction',
            '0%': {transform: 'translate(0, 150px)'},
            '100%': {transform: `translate(0, ${progress > 140 ? 140 : progress}px)`}
        }]);
	},
	
	showRoundSubscription: (tx, r) => {
		
		// r: [address indexed addr, indexed round, place]
		
		let round = r['round'].toNumber();
		
		let place = r['place'].toNumber();
		
		let url = `href=https://ropsten.etherscan.io/tx/${tx}`;
		let subTx = tx.substring(0, 6) + "..." + tx.substring(60);
		let txLink = `<a style="font-family:monospace" target="_blank" ${url}>${subTx}</a>`;
		
		let item = `<div class="list-group-item list-group-item-action">
						<small><b>Ticket #${lpad(r['place'], 2)}</b></small>
						<i class="float-right"><b>${txLink}</b></i>
					</div>`;

		$('#list-round-subs').prepend(item);
	},

	showRoundResult: (tx, r) => {
		//r [address indexed addr, indexed round, place, price]
		let winner = r['addr'];
		let round = r['round'];
		let place = r['place'].toNumber();
		let reward = r['price'] / 10**18;

		let url = `href=https://ropsten.etherscan.io/tx/${tx}`;
		let txLink = `<b><a style="font-family:monospace" target="_blank" ${url}>Won ${(r['price']/1e18).toFixed(1)} ETH</a></b>`;

		let tkUrl = `href=https://ropsten.etherscan.io/address/${winner}`;

		let tkLink = `<b><a style="font-family:monospace" target="_blank" ${tkUrl}>Ticket #${lpad(r['place'], 2)}</a></b>`;

		let item = `<div class="list-group-item list-group-item-action">
						<small><b>Round ${round}</b></small> / <b>${tkLink}</b>
						<i class="float-right">${txLink}</i>
					</div>`;

		$('#list-round-results').prepend(item);
	},
	
	showUserSubscription: (tx, r, currentRound) => {

		//r [address indexed addr, indexed round, place, price]
		let winner = r['addr'];
		let round = r['round'].toNumber();
		let place = r['place'].toNumber();
		let price = r['price'] / 10**18;
		
		let res = currentRound == round ? 'pending' : isNaN(price) ? '-' : `Won ${r['price']/10**18} ETH`;
		
		if(isNaN(price)) {
			let url = `href=https://ropsten.etherscan.io/tx/${tx}`;
			let txLink = `<b><a style="font-family:monospace" target="_blank" ${url}>Ticket #${lpad(r['place'], 2)}</a></b>`;
			let item = `<div class="list-group-item list-group-item-action">
							<small><b>Round ${round}</b></small> / ${txLink} 
							<small class="float-right"><i><span id="${tx}">${res}</span></i></small>
						</div>`;
			$('#list-round-mine').prepend(item);
		} else {
			$(`#${tx}`).text(`${res}`);
		}
	}
};