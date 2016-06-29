module.exports = function (ci) {

  ci.config({
    secret: '12345',
  });

  //test.
  const test = ci.project('test', {
    repertory: 'git@10.211.55.8:houfeng/test.git'
  });
  
  test.job('PULL-PR', function(done){
    this.console.log(this.params);
    this.context.summary = `MR #${this.params.object_attributes.id},${this.params.object_attributes.source_branch}->${this.params.object_attributes.target_branch}`;
    done();
  });

};
