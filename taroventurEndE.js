(function() {
	sym = require("/node_modules/symbol-sdk");
	NODE = "https://sym-test-01.opening-line.jp:3001";
	repo = new sym.RepositoryFactoryHttp(NODE);
	accountRepo = repo.createAccountRepository();
	txRepo = repo.createTransactionRepository();

	let addressE;
	document.getElementById("checkAddressE").onclick = async function () {
		const addressStatusE = document.getElementById("addressStatusE");
		const rawAddressE = document.getElementById("addressE").value;
		if (sym.Address.isValidRawAddress(rawAddressE.replace(/-/g,''))) {
			addressE = sym.Address.createFromRawAddress(rawAddressE);
			accountRepo.getAccountInfo(addressE).subscribe((accountInfo) => {
				const targetMosaicIdE = '7898C25CE92BDEBD';
				const mosaicIdE = new sym.MosaicId(targetMosaicIdE);
				const higherE = mosaicIdE["id"]["higher"];
				const lowerE = mosaicIdE["id"]["lower"];
				const mosaicsE = accountInfo["mosaics"];
				let isMosaicExist;
				mosaicsE.filter(mosaic => {
					if (higherE === mosaic["id"]["id"]["higher"] && lowerE === mosaic["id"]["id"]["lower"]) {
						isMosaicExist = 1;
					}
				});
				if (isMosaicExist === 1) {
					const disableE = document.getElementById("story-box3-disableE");
					disableE.className = "story-box3";
					addressStatusE.innerHTML = "Your tickets have been confirmed! Please continue!";
				} else {
					addressStatusE.innerHTML = "Your ticket could not be confirmed. Please come back after you receive your ticket.";
				}
			}, (err) => {
				console.error(err);
				addressStatusE.innerHTML = "Your ticket could not be confirmed. Please come back after you receive your ticket.";
			});
		} else {
			addressStatusE.innerHTML = "Your ticket could not be confirmed. Please come back after you receive your ticket.";
		};
	}

	document.getElementById("transferE").onclick = async function () {
		const respE = await fetch("https://syisnjy6bd.execute-api.ap-northeast-1.amazonaws.com/prd");
		const jsonE = await respE.json();
		const messageE = jsonE.message;
		const presentE = jsonE.present;
		const epochAdjustmentE = await repo.getEpochAdjustment().toPromise();
		const generationHashE = await repo.getGenerationHash().toPromise();
		const networkTypeE = await repo.getNetworkType().toPromise();
		const keyStatusE = document.getElementById("keyStatusE");
		const targetMosaicIdE = '7898C25CE92BDEBD';
		const keyE = document.getElementById("keyE").value;
		if (keyE === "D73D9AAD1C9403CC8") {
			const taroE = sym.Account.createFromPrivateKey(messageE, networkTypeE);
			const signerAccountE = sym.Account.createFromPrivateKey(presentE, networkTypeE);
			const mosaicIdHexE = '3A8416DB2D53B6C8';
			const mosaicIdE = new sym.MosaicId(mosaicIdHexE);
			const transferTransactionE = sym.TransferTransaction.create(
				sym.Deadline.create(epochAdjustmentE),
				addressE,
				[new sym.Mosaic(mosaicIdE, sym.UInt64.fromUint(100000))],
				sym.PlainMessage.create('Thanks for playing with us! From Taro & Ryo. #ハッカタス2022'),
				networkTypeE,
				sym.UInt64.fromUint(1000000),
			);
			const signedTx2E = signerAccountE.sign(transferTransactionE, generationHashE);
			txRepo.announce(signedTx2E).toPromise();

			const revTxE = sym.MosaicSupplyRevocationTransaction.create(
				sym.Deadline.create(epochAdjustmentE),
				addressE,
				new sym.Mosaic(new sym.MosaicId(targetMosaicIdE), sym.UInt64.fromUint(1)),
				networkTypeE
			).setMaxFee(100);
			const signedTxE = taroE.sign(revTxE,generationHashE);
			txRepo.announce(signedTxE).subscribe(() => {
				window.location.href = "https://taroventurend.com/E-web2story9/";
			}, err => console.log(err));
		} else {
			keyStatusE.innerHTML = "it's the wrong key...";
		}
	}
})();