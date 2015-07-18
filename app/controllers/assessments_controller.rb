require 'open-uri'

class AssessmentsController < ApplicationController

  skip_before_filter :verify_authenticity_token
  
  before_filter :skip_trackable
  before_filter :authenticate_user!, only: [:new, :create, :destroy]
  before_filter :check_lti, only: [:show]
  load_and_authorize_resource except: [:index, :show]

  respond_to :html

  def index
    if params[:user_id].present?
      @assessments = User.find(params[:user_id]).assessments
    else
      @assessments = Assessment.all
    end
  end

  def show
    if params[:load_ui] == 'true'
      @embedded = false
    else
      @embedded = params[:src_url].present? || params[:embed].present? || @is_lti
    end
    @confidence_levels = params[:confidence_levels] ? true : false
    @enable_start = params[:enable_start] ? true : false
    @eid = params[:eid] if params[:eid]
    @keywords = params[:keywords] if params[:keywords]
    @external_user_id = params[:external_user_id] if params[:external_user_id]
    @results_end_point = ensure_scheme(params[:results_end_point]) if params[:results_end_point].present?
    @style = params[:style] ? params[:style] :  ""
    @per_sec = params[:per_sec] ? params[:per_sec] : nil
    if @is_writeback # For now all LTI requests with grade writeback will produce summative assessments. All others will be formative.
      @kind = "summative"
    else
      @kind = "formative"
    end
    if params[:id].present? && !['load', 'offline'].include?(params[:id])
      @assessment = Assessment.find(params[:id])
      @assessment_id = @assessment ? @assessment.id : params[:assessment_id] || 'null'
      @assessment_settings = params[:asid] ? AssessmentSetting.find(params[:asid]) : @assessment.default_settings;
      @style = @assessment.default_style if @assessment.default_style
      if @assessment_settings.present?
        @style = @style != "" ? @style : @assessment_settings[:style] || ""
        @enable_start = params[:enable_start] ?  @enable_start : @assessment_settings[:enable_start] || false
        @confidence_levels = params[:confidence_levels] ?  @confidence_levels : @assessment_settings[:confidence_levels] || false
        @per_sec = @per_sec ? @per_sec : @assessment_settings[:per_sec] || ""
      end
      if params[:user_id].present?
        @user_assessment = @assessment.user_assessments.where(eid: params[:user_id]).first
        if !@user_assessment.nil?
          @user_attempts = @user_assessment.attempts || 0
        else
          @user_assessment = @assessment.user_assessments.create({
            :eid => params[:user_id],
            :attempts => 0
            })
          @user_attempts = @user_assessment.attempts
        end
      end 
      @eid ||= @assessment.identifier
      if @embedded
        # Just show the assessment. This is here to support old style embed with id=# and embed=true
        @src_url = embed_url(@assessment)
      else
        # Show the full page with analtyics and embed code buttons
        @embed_code = embed_code(@assessment, @confidence_levels, @eid, @enable_start, params[:offline].present?, nil, @style, params[:asid], @per_sec)
      end
    else
      # Get the remote url where we can download the qti
      @src_url = ensure_scheme(URI.decode(params[:src_url])) if params[:src_url].present?
      if params[:load_ui] == 'true'
        # Build an embed code and stats page for an assessment loaded via a url
        @embed_code = embed_code(nil, @confidence_levels, @eid, @enable_start, params[:offline].present?, params[:src_url], @style, params[:asid], params[:per_sec])
      end

    end


    if params[:offline].present? && @src_url.present?
      @src_data = open(@src_url).read
      xml = EdxSequentialParser.parse(@src_data)
      # edX
      if defined?(xml.verticals)
        base_uri = @src_url[0, @src_url.index('sequential')];
        @edx_verticals = crawlEdx(base_uri, 'vertical', xml.verticals.map(&:url_name))
        @edx_problems = {}
        @edx_verticals.each do |id, vertical|
          xml = EdxVerticalParser.parse(vertical)
          @edx_problems.merge!(crawlEdx(base_uri, 'problem', xml.problems.map(&:url_name)))
        end
      end
    end

    # extract LTI values
    @external_user_id ||= params[:user_id]

    respond_to do |format|
      format.html { render layout: @embedded ? 'assessment' : 'application' }
    end
  end

  def new
  end

  def create
    @assessment.user = current_user
    @assessment.account = current_account
    @assessment.save!
    respond_with(@assessment)
  end

  def destroy
    @assessment.destroy
    respond_to do |format|
      format.html { redirect_to(user_assessments_url(current_user)) }
    end
  end

  private

    def crawlEdx(base_uri, type, ids)
      ids.inject({}) do |hsh, id|
        hsh[id] = open(base_uri + type + '/' + id + '.xml').read
        hsh
      end
    end

    def assessment_params
      params.require(:assessment).permit(:title, :description, :xml_file, :license, :keyword_list)
    end

    def check_lti
      if request.post?
        do_lti
        @is_lti = true
      end
    end
end
