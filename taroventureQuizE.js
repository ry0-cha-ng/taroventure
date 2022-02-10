(function() {
	NODE = "https://sym-test.opening-line.jp:3001";
	sym = require("/node_modules/symbol-sdk");
	repo = new sym.RepositoryFactoryHttp(NODE);
	accountRepo = repo.createAccountRepository();
	txRepo = repo.createTransactionRepository();
	resAccountRepo = repo.createRestrictionAccountRepository();

	document.getElementById("checkAddressRestrictionE").onclick = async function () {
		const addressStatusE = document.getElementById("addressStatusE");
		const addressE = document.getElementById("addressE").value;
		let res = false;
		if (sym.Address.isValidRawAddress(addressE.replace(/-/g,''))) {
			const targetAddressE = sym.Address.createFromRawAddress(addressE);
			let restrictionsInfo;
			try {
				restrictionsInfo = await resAccountRepo.getAccountRestrictions(targetAddressE).toPromise();
			} catch(e) {
				res = true;
			};

			if(typeof restrictionsInfo !== "undefined"){
				const restrictionsE = restrictionsInfo.restrictions;
				for (restriction of restrictionsE) {
					if (restriction.restrictionFlags === sym.AddressRestrictionFlag.AllowIncomingAddress) {
						for(allowAddress of restriction.values){
							if(allowAddress.address === senderAddress.address)res = true;
						}
					}
					if (restriction.restrictionFlags === sym.AddressRestrictionFlag.BlockIncomingAddress) {
						res = true;
						for (blockAddress of restriction.values) {
							if (blockAddress.address === senderAddress.address)res = false;
						};
					};
				};
			}
		}

		if (res) {
			const recipientAddressE = sym.Address.createFromRawAddress(addressE);
			const respE = await fetch("https://p9s6fqnwr4.execute-api.ap-northeast-1.amazonaws.com/prd");
			const jsonE = await respE.json();
			const messageE = jsonE.message;
			const ticketE = jsonE.ticket;
			const epochAdjustmentE = await repo.getEpochAdjustment().toPromise();
			const generationHashE = await repo.getGenerationHash().toPromise();
			const networkTypeE = await repo.getNetworkType().toPromise();
			const mosaicIdHexE = '7898C25CE92BDEBD';
			const mosaicIdE = new sym.MosaicId(mosaicIdHexE);
			const signerAccountE = sym.Account.createFromPrivateKey(messageE, networkTypeE);
			const plainMessageE = "I'll see you on the Ferris wheel! → " + ticketE;
			const transferTransactionE = sym.TransferTransaction.create(
				sym.Deadline.create(epochAdjustmentE),
				recipientAddressE,
				[new sym.Mosaic(mosaicIdE, sym.UInt64.fromUint(1))],
				sym.PlainMessage.create(plainMessageE),
				networkTypeE,
				sym.UInt64.fromUint(1000000),
			);
			const signedTxE = signerAccountE.sign(transferTransactionE, generationHashE);
			return await txRepo.announce(signedTxE).subscribe(() => {
				window.location.href = "https://taroventure.com/E-web1story7/";
			}, err => console.log(err));
		} else {
			addressStatusE.innerHTML = "I can't give you a present...";
		}
	};
})();