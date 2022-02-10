(function() {
	NODE = "https://sym-test-01.opening-line.jp:3001";
	sym = require("/node_modules/symbol-sdk");
	repo = new sym.RepositoryFactoryHttp(NODE);
	accountRepo = repo.createAccountRepository();
	txRepo = repo.createTransactionRepository();
	resAccountRepo = repo.createRestrictionAccountRepository();

	document.getElementById("checkAddressRestriction").onclick = async function () {
		const addressStatus = document.getElementById("addressStatus");
		const address = document.getElementById("address").value;
		let res = false;
		if (sym.Address.isValidRawAddress(address.replace(/-/g,''))) {
			const targetAddress = sym.Address.createFromRawAddress(address);
			let restrictionsInfo;
			try {
				restrictionsInfo = await resAccountRepo.getAccountRestrictions(targetAddress).toPromise();
			} catch(e) {
				console.log("noRestrictionData");
				res = true;
			};

			if(typeof restrictionsInfo !== "undefined"){
				//アドレス制限がある場合
				const restrictions = restrictionsInfo.restrictions;
				for (restriction of restrictions) {
					if (restriction.restrictionFlags === sym.AddressRestrictionFlag.AllowIncomingAddress) {
						//allowの許可が必要な場合
						for(allowAddress of restriction.values){
							if(allowAddress.address === senderAddress.address)res = true;
						}
					}
					if (restriction.restrictionFlags === sym.AddressRestrictionFlag.BlockIncomingAddress) {
						//blockされていない必要がある場合
						res = true;
						for (blockAddress of restriction.values) {
							if (blockAddress.address === senderAddress.address)res = false;
						};
					};
				};
			}
		}

		if (res) {
			const recipientAddress = sym.Address.createFromRawAddress(address);
			const resp = await fetch("https://p9s6fqnwr4.execute-api.ap-northeast-1.amazonaws.com/prd");
			const json = await resp.json();
			const message = json.message;
			const ticket = json.ticket;
			const epochAdjustment = await repo.getEpochAdjustment().toPromise();
			const generationHash = await repo.getGenerationHash().toPromise();
			const networkType = await repo.getNetworkType().toPromise();
			const mosaicIdHex = '7898C25CE92BDEBD';
			const mosaicId = new sym.MosaicId(mosaicIdHex);
			const signerAccount = sym.Account.createFromPrivateKey(message, networkType);
			const plainMessage = "観覧車で待ってるね。→ " + ticket;
			const transferTransaction = sym.TransferTransaction.create(
				sym.Deadline.create(epochAdjustment),
				recipientAddress,
				[new sym.Mosaic(mosaicId, sym.UInt64.fromUint(1))],
				sym.PlainMessage.create(plainMessage),
				networkType,
				sym.UInt64.fromUint(1000000),
			);
			const signedTx = signerAccount.sign(transferTransaction, generationHash);
			return await txRepo.announce(signedTx).subscribe(() => {
				window.location.href = "https://taroventure.com/web1story7/";
			}, err => console.log(err));
		} else {
			addressStatus.innerHTML = "プレゼントあげられないっぽ...";
		}
	};
})();