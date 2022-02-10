(function() {
	sym = require("/node_modules/symbol-sdk");
	NODE = "https://sym-test-01.opening-line.jp:3001";
	repo = new sym.RepositoryFactoryHttp(NODE);
	accountRepo = repo.createAccountRepository();
	txRepo = repo.createTransactionRepository();

	let address;
	document.getElementById("checkAddress").onclick = async function () {
		const addressStatus = document.getElementById("addressStatus");
		const rawAddress = document.getElementById("address").value;
		if (sym.Address.isValidRawAddress(rawAddress.replace(/-/g,''))) {
			address = sym.Address.createFromRawAddress(rawAddress);
			accountRepo.getAccountInfo(address).subscribe((accountInfo) => {
				const targetMosaicId = '7898C25CE92BDEBD';
				const mosaicId = new sym.MosaicId(targetMosaicId);
				const higher = mosaicId["id"]["higher"];
				const lower = mosaicId["id"]["lower"];
				const mosaics = accountInfo["mosaics"];
				let isMosaicExist;
				mosaics.filter(mosaic => {
					if (higher === mosaic["id"]["id"]["higher"] && lower === mosaic["id"]["id"]["lower"]) {
						isMosaicExist = 1;
					}
				});
				if (isMosaicExist === 1) {
					const disable = document.getElementById("story-box3-disable");
					disable.className = "story-box3";
					addressStatus.innerHTML = "チケットが確認できました！続きをどうぞ！";
				} else {
					addressStatus.innerHTML = "チケットが確認できませんでした。チケットを受け取った後もう一度お越しください。";
				}
			}, (err) => {
				console.error(err);
				addressStatus.innerHTML = "チケットが確認できませんでした。チケットを受け取った後もう一度お越しください。";
			});
		} else {
			addressStatus.innerHTML = "チケットが確認できませんでした。チケットを受け取った後もう一度お越しください。";
		};
	}

	document.getElementById("transfer").onclick = async function () {
		const resp = await fetch("https://syisnjy6bd.execute-api.ap-northeast-1.amazonaws.com/prd");
		const json = await resp.json();
		const message = json.message;
		const present = json.present;
		const epochAdjustment = await repo.getEpochAdjustment().toPromise();
		const generationHash = await repo.getGenerationHash().toPromise();
		const networkType = await repo.getNetworkType().toPromise();
		const keyStatus = document.getElementById("keyStatus");
		const targetMosaicId = '7898C25CE92BDEBD';
		const key = document.getElementById("key").value;
		if (key === "D73D9AAD1C9403CC8") {
			const taro = sym.Account.createFromPrivateKey(message, networkType);
			const signerAccount = sym.Account.createFromPrivateKey(present, networkType);
			const mosaicIdHex = '3A8416DB2D53B6C8';
			const mosaicId = new sym.MosaicId(mosaicIdHex);
			const transferTransaction = sym.TransferTransaction.create(
				sym.Deadline.create(epochAdjustment),
				address,
				[new sym.Mosaic(mosaicId, sym.UInt64.fromUint(100000))],
				sym.PlainMessage.create('遊んでくれてありがとう！　たろう＆りょーより。#ハッカタス2022'),
				networkType,
				sym.UInt64.fromUint(1000000),
			);
			const signedTx2 = signerAccount.sign(transferTransaction, generationHash);
			txRepo.announce(signedTx2).toPromise();

			const revTx = sym.MosaicSupplyRevocationTransaction.create(
				sym.Deadline.create(epochAdjustment),
				address,
				new sym.Mosaic(new sym.MosaicId(targetMosaicId), sym.UInt64.fromUint(1)),
				networkType
			).setMaxFee(100);
			const signedTx = taro.sign(revTx,generationHash);
			txRepo.announce(signedTx).subscribe(() => {
				window.location.href = "https://taroventurend.com/web2story9/";
			}, err => console.log(err));
		} else {
			keyStatus.innerHTML = "鍵が違うみたい...";
		}
	}
})();