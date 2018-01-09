
window.onload = function(){
    //a little time for web3 injection
    setTimeout(function(){
        var account = web3.eth.accounts[0];

        if (typeof localStorage['githubUsername'] !='undefined'){
            $('input[name=githubUsername]').val(localStorage['githubUsername']);
        }
        if (typeof localStorage['notificationEmail'] !='undefined'){
            $('input[name=notificationEmail]').val(localStorage['notificationEmail']);
        }
        if (typeof localStorage['acceptTOS'] !='undefined' && localStorage['acceptTOS']){
            $('input[name=terms]').attr('checked','checked');
        }
        if(getParam('source')){
            $('input[name=issueURL]').val(getParam('source'));
        }


        $('#submitBounty').click(function(e){
            mixpanel.track("Claim Bounty Clicked", {});
            loading_button($('#submitBounty'));
            e.preventDefault();
            var notificationEmail = $('input[name=notificationEmail]').val();
            var githubUsername = $('input[name=githubUsername]').val();
            var issueURL = $('input[name=issueURL]').val();
            var claimee_metadata = JSON.stringify({
                notificationEmail : notificationEmail,
                githubUsername : githubUsername,
            });
            localStorage['githubUsername'] = githubUsername;

            var isError = false;
            if($('#terms:checked').length == 0){
                _alert({ message: "Please accept the terms of service." });
                isError = true;
            } else {
                localStorage['acceptTOS'] = true;
            }
            if(issueURL == ''){
                _alert({ message: "Please enter a issue URL." });
                isError = true;
            }
            if(isError){
                unloading_button($('#submitBounty'));
                return;
            }

            var bounty = web3.eth.contract(bounty_abi).at(bounty_address());

            ipfs.ipfsApi = IpfsApi({host: 'ipfs.infura.io', port: '5001', protocol: "https", root:'/api/v0'});
            ipfs.setProvider({ host: 'ipfs.infura.io', port: 5001, protocol: 'https', root:'/api/v0'});

        // ipfs.addJSON({description: data, sourceFileName: this.state.sourceFileName, sourceDirectoryHash: this.state.sourceDirectoryHash, sourceFileHash: this.state.sourceFileHash, contact: contact}, (err, succ)=> {

            var submit = {
                description: issueURL,
                sourceFileName: "",
                sourceFileHash: "",
                sourceDirectoryHash: "",
                contact: notificationEmail,
            }

            var _callback = function(error, result){
                var ignore_error = false;
                if(error){
                    console.error(error);
                    mixpanel.track("Fulfill Bounty Error", {step: '_callback', error: error});
                    ignore_error = String(error).indexOf('BigNumber') != -1;
                }
                localStorage['dataHash'] = result;  // Cache IPFS data hash
                var run_main = !error || ignore_error;
                if(error && !ignore_error){
                    _alert({ message: "Could not get bounty details." });
                    unloading_button($('#submitBounty'));
                }
                if(run_main){
                    if(!ignore_error){
                        // var bountyAmount = result[0].toNumber();
                        // bountyDetails = [bountyAmount, result[1], result[2], result[3]];
                        // var fromAddress = result[2];
                        // var claimeeAddress = result[3];
                        // var open = result[4];
                        // var initialized = result[5];

                        // var errormsg = undefined;
                        // if(bountyAmount == 0 || open == false || initialized == false){
                        //     errormsg = "No active bounty found at this address.  Are you sure this is an active bounty?";
                        // } 

                        // if(errormsg){
                        //     _alert({ message: errormsg });
                        //     unloading_button($('#submitBounty'));
                        //     return;
                        // }
                        // 
                        // 
                        var web3Callback = function(error, result){
                            var next = function(){
                                localStorage['txid'] = result;
                                sync_web3(issueURL);
                                localStorage[issueURL] = timestamp();  //ipfs timestamp
                                add_to_watch_list(issueURL);
                                _alert({ message: "Fulfillment submitted to web3." },'info');
                                setTimeout(function(){
                                    mixpanel.track("Fulfill Bounty Success", {});
                                    document.location.href= "/funding/details?url="+issueURL;
                                },1000);

                            };
                            if(error){
                                mixpanel.track("Fulfill Bounty Error", {step: 'callback', error: error});
                                console.error("err", error);
                                _alert({ message: "There was an error" });
                                unloading_button($('#submitBounty'));
                            } else {
                                next();
                            }
                        };

                        // Get bountyId from the database
                        var uri = '/api/v0.1/bounties?github_url='+issueURL;
                        $.get(uri, function(results){
                            results = sanitizeAPIResults(results);
                            result = results[0];
                            var bountyId = result['standard_bounties_id'];

                            bounty.fulfillBounty(bountyId, localStorage['dataHash'], web3Callback);
                        })
                    }


                    // execute along inside _callback function
//                     setTimeout(function(){
//                         bounty.claimBounty.estimateGas(
//                             issueURL, 
//                             claimee_metadata, 
//                             function(errors,result){
//                                 if(errors){
//                                     _alert({ message: "This issue is no longer active.  Please leave a comment <a href=https://github.com/gitcoinco/web/issues/169>here</a> if you need help." });
//                                     mixpanel.track("Claim Bounty Error", {step: 'estimateGas', error: errors});
//                                     return;
//                                 }
//                                 var gas = Math.round(result * gasMultiplier);
//                                 var gasLimit = Math.round(gas * gasLimitMultiplier);
//                                 bounty.claimBounty.sendTransaction(issueURL, 
//                                     claimee_metadata,
//                                     {
//                                         from : account,
//                                         gas:web3.toHex(gas), 
//                                         gasLimit: web3.toHex(gasLimit), 
//                                         gasPrice:web3.toHex(defaultGasPrice), 
//                                     }, 
//                                 callback);
//                         });
//                     },100);
                    e.preventDefault();
                }
            }; //_callback
            // bounty.bountydetails.call(issueURL, _callback);
            ipfs.addJson(submit, _callback);
        });
    },100);

};