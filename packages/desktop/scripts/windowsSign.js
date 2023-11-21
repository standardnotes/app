exports.default = async function(configuration) {
  if(configuration.path){
    require("child_process").execSync(
      `smctl sign --keypair-alias=${sn-keypair} --input "${String(configuration.path)}"`
    );
  }
};
